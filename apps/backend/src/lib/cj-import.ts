import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules, ProductStatus } from "@medusajs/framework/utils"
import { createInventoryLevelsWorkflow, createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { getCjProduct } from "./cj"
import { planImport, type ImportPlan } from "./cj-catalog"

// Import d'un produit CJ en BROUILLON : rien n'est visible sur la boutique avant relecture et publication dans l'admin
// (titre et description en anglais à réécrire, photos à vérifier). Les photos sont copiées dans notre stockage :
// une URL d'image chez CJ révélerait le fournisseur. Prix d'achat et référence CJ → table privée supplier_variant.

export const cjOptions = (countryCode: string) => ({
  countryCode, usdToEur: Number(process.env.CJ_USD_EUR) || 0.92, coef: Number(process.env.CJ_PRICE_COEF) || 2.5,
})

export async function previewCjProduct(container: MedusaContainer, pid: string, supplierId: string) {
  const supplier = await (container.resolve(SUPPLIER_MODULE) as SupplierModuleService).retrieveSupplier(supplierId)
  if (supplier.integration !== "cj") throw new Error("Ce fournisseur n'est pas relié à l'API CJ")
  const plan = planImport(await getCjProduct(pid, supplier.country.toUpperCase()), cjOptions(supplier.country))
  const vids = "error" in plan ? [] : plan.variants.map((v) => v.vid)
  const already = vids.length ? await (container.resolve(SUPPLIER_MODULE) as SupplierModuleService).listSupplierVariants({ sku: vids }, { select: ["id"] }) : []
  return { supplier, plan, alreadyImported: already.length > 0 }
}

async function copyImages(container: MedusaContainer, urls: string[], handle: string): Promise<string[]> {
  const files = container.resolve(Modules.FILE)
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const out: string[] = []
  for (const [i, url] of urls.entries()) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
      const type = res.headers.get("content-type") ?? ""
      if (!res.ok || !/^image\/(jpeg|png|webp)$/.test(type)) throw new Error(`${res.status} ${type}`)
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 5_000_000) throw new Error("image > 5 Mo")
      const ext = type.split("/")[1].replace("jpeg", "jpg")
      const [f] = await files.createFiles([{ filename: `${handle}-${i + 1}.${ext}`, mimeType: type, content: buf.toString("base64") }])
      out.push(f.url)
    } catch (e) { logger.warn(`[import CJ] photo ignorée (${(e as Error).message})`) }
  }
  return out
}

export async function importCjProduct(container: MedusaContainer, input: { pid: string; supplier_id: string; category_id: string; gender: "female" | "male" }) {
  const { supplier, plan, alreadyImported } = await previewCjProduct(container, input.pid, input.supplier_id)
  if ("error" in plan) throw new Error(plan.error)
  if (alreadyImported) throw new Error("Produit déjà importé")
  const query = container.resolve(ContainerRegistrationKeys.QUERY)

  const { data: taken } = await query.graph({ entity: "product", fields: ["handle"], filters: { handle: { $like: `${plan.handle}%` } } })
  const handles = new Set(taken.map((p: { handle: string }) => p.handle))
  let handle = plan.handle
  for (let n = 2; handles.has(handle); n++) handle = `${plan.handle}-${n}`

  const images = await copyImages(container, plan.images, handle)
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
    metadata: { gender: input.gender, age_group: "adult", item_group_id: handle },
    variants: plan.variants.map((v) => ({
      title: `${v.size} / ${v.color}`, sku: skuOf(v), manage_inventory: true,
      options: { Taille: v.size, Couleur: v.color }, prices: [{ currency_code: "eur", amount: v.priceEur }],
    })),
  }] } })

  const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "sku", "inventory_items.inventory_item_id"], filters: { product_id: product.id } })
  const bySku = new Map(variants.map((v: any) => [v.sku, v]))
  await (container.resolve(SUPPLIER_MODULE) as SupplierModuleService).createSupplierVariants(plan.variants.map((v) => ({
    variant_id: bySku.get(skuOf(v))!.id, supplier_id: supplier.id, sku: v.vid, cost_cents: v.costCents,
  })))
  await createInventoryLevelsWorkflow(container).run({ input: { inventory_levels: plan.variants.map((v) => ({
    location_id: locs[0].id, inventory_item_id: bySku.get(skuOf(v))!.inventory_items[0].inventory_item_id, stocked_quantity: v.stock,
  })) } })
  return { product_id: product.id, handle, variants: plan.variants.length, images: images.length, skipped: plan.skipped }
}
