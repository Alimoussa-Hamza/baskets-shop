import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { orderConfirmation } from "../lib/emails"

// Confirmation de commande au client (copie cachée à la boutique).
export default async function handler({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  if (!process.env.SMTP_HOST) {
    logger.warn(`[commande] ${event.data.id} : aucun e-mail de confirmation, SMTP non configuré`)
    return
  }
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "total", "tax_total", "shipping_total", "items.title", "items.variant_title", "items.quantity", "items.total", "shipping_methods.name", "shipping_address.*"],
    filters: { id: event.data.id },
  })
  const o = data[0]
  if (!o?.email) return
  const a = o.shipping_address
  const mail = orderConfirmation({
    displayId: Number(o.display_id),
    items: (o.items ?? []).map((i: any) => ({ title: i.title, variant: i.variant_title, quantity: Number(i.quantity), total: Number(i.total) })),
    shippingName: o.shipping_methods?.[0]?.name, shippingTotal: Number(o.shipping_total), taxTotal: Number(o.tax_total), total: Number(o.total),
    address: a ? [`${a.first_name ?? ""} ${a.last_name ?? ""}`.trim(), a.address_1, `${a.postal_code ?? ""} ${a.city ?? ""}`.trim()].filter(Boolean).join(", ") : undefined,
  })
  await container.resolve(Modules.NOTIFICATION).createNotifications({
    to: o.email, channel: "email", template: "order-confirmation", content: mail, data: { order_id: o.id },
    provider_data: process.env.SHOP_NOTIFY_EMAIL ? { bcc: process.env.SHOP_NOTIFY_EMAIL } : undefined,
  })
  logger.info(`[commande] confirmation envoyée pour #${o.display_id}`)
}

export const config: SubscriberConfig = { event: "order.placed" }
