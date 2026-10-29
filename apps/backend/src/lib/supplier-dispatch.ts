import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { costTotalCents, groupLinesBySupplier, type OrderLine, type SupplierLine } from "./supplier-lines"
import { createCjOrder } from "./cj"
import { purchaseOrder, shipmentNotice } from "./emails"

const COUNTRY_NAMES: Record<string, string> = { fr: "France", be: "Belgique", lu: "Luxembourg", de: "Allemagne", es: "Espagne", it: "Italie" }

async function loadOrder(container: MedusaContainer, orderId: string) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: [
      "id", "display_id", "email", "items.id", "items.title", "items.variant_title", "items.quantity",
      "items.variant.sku", "items.variant.metadata", "items.product.metadata", "shipping_address.*",
    ],
    filters: { id: orderId },
  })
  return data[0] as unknown as ({ id: string; display_id: number; email: string | null; items: OrderLine[]; shipping_address: Record<string, string | null> | null }) | undefined
}

/** Une commande fournisseur par fournisseur concerné. Idempotent : un fournisseur déjà traité pour cette commande est ignoré. */
export async function createSupplierOrdersForOrder(container: MedusaContainer, orderId: string): Promise<string[]> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const svc: SupplierModuleService = container.resolve(SUPPLIER_MODULE)
  const order = await loadOrder(container, orderId)
  if (!order) return []
  const { bySupplier, unassigned } = groupLinesBySupplier(order.items ?? [])
  if (unassigned.length) logger.warn(`[fournisseur] commande #${order.display_id} : ${unassigned.length} ligne(s) sans fournisseur (${unassigned.map((l) => l.title).join(", ")}) : à traiter à la main`)
  const existing = await svc.listSupplierOrders({ order_id: order.id }, { relations: ["supplier"] })
  const done = new Set(existing.map((o) => o.supplier.id))
  const created: string[] = []
  for (const [supplierId, lines] of bySupplier) {
    if (done.has(supplierId)) continue
    const spo = await svc.createSupplierOrders({
      order_id: order.id, supplier_id: supplierId, status: "to_place",
      lines: { lines }, cost_total_cents: costTotalCents(lines),
    })
    created.push(spo.id)
  }
  return created
}

/** Transmet une commande fournisseur (API CJ ou e-mail). En cas d'échec : reste « à passer » avec l'erreur, relançable depuis l'admin. */
export async function dispatchSupplierOrder(container: MedusaContainer, spoId: string): Promise<void> {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const svc: SupplierModuleService = container.resolve(SUPPLIER_MODULE)
  const spo = await svc.retrieveSupplierOrder(spoId, { relations: ["supplier"] })
  if (spo.status !== "to_place") return
  const order = await loadOrder(container, spo.order_id)
  const a = order?.shipping_address
  try {
    if (!order || !a) throw new Error("commande ou adresse de livraison introuvable")
    const lines = ((spo.lines as { lines?: SupplierLine[] } | null)?.lines ?? [])
    const name = `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()
    const cc = (a.country_code ?? "fr").toLowerCase()
    let reference: string | null = null

    if (spo.supplier.integration === "cj") {
      if (!spo.supplier.logistic_name) throw new Error("transporteur CJ (logistic_name) non renseigné sur le fournisseur")
      const missing = lines.filter((l) => !l.sku)
      if (missing.length) throw new Error(`référence CJ (supplier_sku) manquante : ${missing.map((l) => l.title).join(", ")}`)
      const r = await createCjOrder({
        orderNumber: spo.id, fromCountryCode: spo.supplier.country.toUpperCase(), logisticName: spo.supplier.logistic_name,
        shipping: { name, address1: a.address_1 ?? "", address2: a.address_2, zip: a.postal_code, city: a.city ?? "", province: a.province,
          countryCode: cc.toUpperCase(), country: COUNTRY_NAMES[cc] ?? cc.toUpperCase(), phone: a.phone, email: order.email },
        products: lines.map((l) => ({ vid: l.sku!, quantity: l.quantity, storeLineItemId: l.line_item_id })),
      })
      reference = r.orderId ?? spo.id
    } else {
      if (!process.env.SMTP_HOST) throw new Error("SMTP non configuré : bon de commande non envoyé")
      const mail = purchaseOrder({
        reference: spo.id, orderDisplayId: Number(order.display_id), lines,
        address: { name, phone: a.phone, lines: [a.address_1, a.address_2, `${a.postal_code ?? ""} ${a.city ?? ""}`.trim(), COUNTRY_NAMES[cc] ?? cc.toUpperCase()].filter((x): x is string => !!x) },
      })
      await container.resolve(Modules.NOTIFICATION).createNotifications({
        to: spo.supplier.email, channel: "email", template: "supplier-purchase-order", content: mail, data: { supplier_order_id: spo.id },
        provider_data: process.env.SHOP_NOTIFY_EMAIL ? { bcc: process.env.SHOP_NOTIFY_EMAIL } : undefined,
      })
      reference = spo.id
    }
    await svc.updateSupplierOrders({ id: spo.id, status: "placed", placed_at: new Date(), supplier_reference: reference, last_error: null })
    logger.info(`[fournisseur] ${spo.id} transmise à ${spo.supplier.name} (${spo.supplier.integration}) pour la commande #${order.display_id}`)
  } catch (e) {
    const msg = (e as Error).message.slice(0, 500)
    await svc.updateSupplierOrders({ id: spo.id, last_error: msg })
    logger.error(`[fournisseur] échec de transmission ${spo.id} : ${msg}`)
  }
}

/** Expédition saisie (admin) : statut « expédiée » + e-mail de suivi au client. */
export async function markSupplierOrderShipped(container: MedusaContainer, spoId: string, tracking: { number: string; carrier?: string | null }) {
  const svc: SupplierModuleService = container.resolve(SUPPLIER_MODULE)
  const spo = await svc.retrieveSupplierOrder(spoId)
  const updated = await svc.updateSupplierOrders({ id: spo.id, status: "shipped", tracking_number: tracking.number, carrier: tracking.carrier ?? null, shipped_at: new Date() })
  const order = await loadOrder(container, spo.order_id)
  if (order?.email && process.env.SMTP_HOST) {
    const lines = ((spo.lines as { lines?: SupplierLine[] } | null)?.lines ?? [])
    const mail = shipmentNotice({ orderDisplayId: Number(order.display_id), carrier: tracking.carrier, trackingNumber: tracking.number,
      items: lines.map((l) => `${l.quantity} × ${l.title}${l.variant ? ` (${l.variant})` : ""}`) })
    await container.resolve(Modules.NOTIFICATION).createNotifications({
      to: order.email, channel: "email", template: "order-shipped", content: mail, data: { supplier_order_id: spo.id },
      provider_data: process.env.SHOP_NOTIFY_EMAIL ? { bcc: process.env.SHOP_NOTIFY_EMAIL } : undefined,
    })
  }
  return updated
}
