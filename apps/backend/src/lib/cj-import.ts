import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { cjFreight, getCjProduct } from "./cj"
import { planImport, type ImportPlan } from "./cj-catalog"

// Import d'un produit CJ en BROUILLON : rien n'est visible sur la boutique avant relecture et publication dans l'admin
// (titre et description en anglais à réécrire, photos à vérifier). Les photos sont copiées dans notre stockage :
// une URL d'image chez CJ révélerait le fournisseur. Coût de revient (achat + port + douane) et référence CJ → table
// privée supplier_variant. Délai de livraison annoncé → métadonnée produit delivery_days (affichée par la boutique).

export const usdToEur = () => Number(process.env.CJ_USD_EUR) || 0.92

/** Port CJ (transporteur du fournisseur, vers la France) et délai annoncé au client : transport + 3 jours de préparation. */
async function shippingFor(vid: string, supplier: { country: string; logistic_name: string | null }) {
  const options = await cjFreight(vid, supplier.country, "FR")
  const o = options.find((x) => x.logisticName === supplier.logistic_name)
  if (!o) throw new Error(`Transporteur « ${supplier.logistic_name} » indisponible pour ce produit (proposés : ${options.slice(0, 5).map((x) => x.logisticName).join(", ")})`)
  const [min, max] = (o.logisticAging.match(/\d+/g) ?? []).map(Number)
  return { shippingEur: Math.round(o.logisticPrice * usdToEur() * 100) / 100, deliveryDays: min && max ? `${min + 3} à ${max + 3}` : null }
}

export async function previewCjProduct(container: MedusaContainer, pid: string, supplierId: string) {
  const svc = container.resolve(SUPPLIER_MODULE) as SupplierModuleService
  const supplier = await svc.retrieveSupplier(supplierId)
  if (supplier.integration !== "cj") throw new Error("Ce fournisseur n'est pas relié à l'API CJ")
  const product = await getCjProduct(pid)
  const firstVid = product.variants?.[0]?.vid
  if (!firstVid) throw new Error("Produit sans variante")
  const ship = await shippingFor(firstVid, supplier)
  const plan = planImport(product, {
    countryCode: supplier.country, usdToEur: usdToEur(), coef: Number(process.env.CJ_PRICE_COEF) || 2,
    shippingEur: ship.shippingEur, dutyEur: supplier.ships_from_eu ? 0 : Number(process.env.CUSTOMS_DUTY_EUR ?? 3),
  })
  const vids = "error" in plan ? [] : plan.variants.map((v) => v.vid)
  const rows = vids.length ? await svc.listSupplierVariants({ sku: vids }, { select: ["id", "variant_id"] }) : []
  // Lignes d'un produit supprimé depuis : orphelines, on les retire (le produit peut être réimporté)
  const { data: alive } = rows.length ? await container.resolve(ContainerRegistrationKeys.QUERY).graph({ entity: "product_variant", fields: ["id"], filters: { id: rows.map((r) => r.variant_id) } }) : { data: [] }
  const aliveIds = new Set(alive.map((v: { id: string }) => v.id))
  const orphans = rows.filter((r) => !aliveIds.has(r.variant_id))
  if (orphans.length) await svc.deleteSupplierVariants(orphans.map((r) => r.id))
  return { supplier, plan, shipping: ship, alreadyImported: rows.length > orphans.length }
}

/** Copie des photos dans notre stockage ; renvoie l'URL copiée de chaque photo CJ (pour relier une couleur à sa photo). */
async function copyImages(container: MedusaContainer, urls: string[], handle: string): Promise<Map<string, string>> {
  const files = container.resolve(Modules.FILE)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const out = new Map<string, string>()
  for (const [i, url] of urls.entries()) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      const type = (res.headers.get("content-type") ?? "").split(";")[0].trim().replace("image/jpg", "image/jpeg") // CJ envoie « image/jpg »
      if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type)) throw new Error(`${res.status} ${type}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 5_000_000) throw new Error("image > 5 Mo")
      const ext = type.split("/")[1].replace("jpeg", "jpg")
      const [f] = await files.createFiles([{ filename: `${handle}-${i + 1}.${ext}`, mimeType: type, content: buf.toString("base64") }])
      out.set(url, f.url)
    } catch (e) { logger.warn(`[import CJ] photo ignorée (${(e as Error).message})`) }
  }
  return out
}

export async function importCjProduct(container: MedusaContainer, input: { pid: string; supplier_id: string; category_id: string; gender: "female" | "male" }) {
  const { supplier, plan, shipping, alreadyImported } = await previewCjProduct(container, input.pid, input.supplier_id)
  if ("error" in plan) throw new Error(plan.error)
  if (alreadyImported) throw new Error("Produit déjà importé")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: taken } = await query.graph({ entity: "product", fields: ["handle"], filters: { handle: { $like: `${plan.handle}%` } } })
  const handles = new Set(taken.map((p: { handle: string }) => p.handle))
  let handle = plan.handle
  for (let n = 2; handles.has(handle); n++) handle = `${plan.handle}-${n}`

  const copied = await copyImages(container, plan.images, handle)
  const images = [...copied.values()]
  const [profile] = await container.resolve(Modules.FULFILLMENT).listShippingProfiles({ type: "default" })
  const [channel] = await container.resolve(Modules.SALES_CHANNEL).listSalesChannels({ name: "Boutique en ligne" })
  const { data: locs } = await query.graph({ entity: "stock_location", fields: ["id"], filters: { name: "Fournisseur UE (dropshipping)" } })
  if (!profile || !channel || !locs[0]) throw new Error("Boutique non initialisée (profil d'expédition, canal « Boutique en ligne » ou dépôt « Fournisseur UE (dropshipping) » manquant)")

  const skuOf = (v: ImportPlan["variants"][number]) => `${handle}-${v.size}-${v.color}`.toLowerCase().normalize("NFD").replace(/[^a-z0-9.-]/g, "")
  const { result: [product] } = await createProductsWorkflow(container).run({ input: { products: [{
    title: plan.title, handle, description: plan.description, status: ProductStatus.DRAFT,
    shipping_profile_id: profile.id, category_ids: [input.category_id], sales_channels: [{ id: channel.id }],
    images: images.map((url) => ({ url })), thumbnail: images[0],
    options: [{ title: "Taille", values: plan.sizes }, { title: "Couleur", values: plan.colors }],
    metadata: { gender: input.gender, age_group: "adult", item_group_id: handle, ...(shipping.deliveryDays ? { delivery_days: shipping.deliveryDays } : {}) },
    variants: plan.variants.map((v) => ({
      title: `${v.size} / ${v.color}`, sku: skuOf(v), manage_inventory: true,
      options: { Taille: v.size, Couleur: v.color }, prices: [{ currency_code: "eur", amount: v.priceEur }],
      // Photo du coloris : la fiche produit l'affiche quand le client choisit cette couleur
      ...(v.image && copied.has(v.image) ? { metadata: { image: copied.get(v.image) } } : {}),
    })),
  }] } })

  const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "sku", "inventory_items.inventory_item_id"], filters: { product_id: product.id } })
  const bySku = new Map(variants.map((v: any) => [v.sku, v]))
  await (container.resolve(SUPPLIER_MODULE) as SupplierModuleService).createSupplierVariants(plan.variants.map((v) => ({
    variant_id: bySku.get(skuOf(v))!.id, supplier_id: supplier.id, sku: v.vid, cost_cents: v.landedCents,
  })))
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: plan.variants.map((v) => ({
    location_id: locs[0].id, inventory_item_id: bySku.get(skuOf(v))!.inventory_items[0].inventory_item_id, stocked_quantity: v.stock,
  })) } })
  return { product_id: product.id, handle, variants: plan.variants.length, images: images.length, skipped: plan.skipped }
}
