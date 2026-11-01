import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { cjStock } from "./cj"

// Recopie le stock CJ (entrepôt du fournisseur) dans le dépôt « Fournisseur UE (dropshipping) » : une paire
// épuisée chez CJ devient indisponible sur la boutique. Un appel par variante (QPS = 1 : ~1 s par variante).
export async function syncCjStock(container: MedusaContainer): Promise<{ updated: number; failed: number }> {
  if (!process.env.CJ_API_KEY) return { updated: 0, failed: 0 }
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventory = container.resolve(Modules.INVENTORY)
  const rows = (await (container.resolve(SUPPLIER_MODULE) as SupplierModuleService).listSupplierVariants({}, { relations: ["supplier"] }))
    .filter((r) => r.supplier.integration === "cj" && r.supplier.active && r.sku)
  if (!rows.length) return { updated: 0, failed: 0 }
  const { data: locs } = await query.graph({ entity: "stock_location", fields: ["id"], filters: { name: "Fournisseur UE (dropshipping)" } })
  const { data: variants } = await query.graph({ entity: "product_variant", fields: ["id", "inventory_items.inventory_item_id"], filters: { id: rows.map((r) => r.variant_id) } })
  const itemOf = new Map(variants.map((v: any) => [v.id, v.inventory_items?.[0]?.inventory_item_id as string | undefined]))
  let updated = 0, failed = 0
  for (const r of rows) {
    const item = itemOf.get(r.variant_id)
    if (!item || !locs[0]) continue
    try {
      const qty = await cjStock(r.sku!, r.supplier.country)
      await inventory.updateInventoryLevels([{ inventory_item_id: item, location_id: locs[0].id, stocked_quantity: qty }])
      updated++
    } catch (e) { failed++; logger.warn(`[stock CJ] ${r.sku} : ${(e as Error).message}`) }
  }
  return { updated, failed }
}
