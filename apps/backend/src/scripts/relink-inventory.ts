import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

// Réparation d'un bug constaté sur Medusa 2.22.1 (29/10/2026) : désactiver puis réactiver « Gérer le stock » d'une
// variante dans l'admin échoue (« Inventory item with sku … already exists »). La désactivation supprime le lien
// variante → article de stock mais garde l'article ; la réactivation veut en recréer un avec le même SKU.
// Ce script relie chaque variante sans gestion de stock à l'article existant de même SKU, puis réactive la gestion.
//   npx medusa exec ./src/scripts/relink-inventory.ts            (toutes les variantes concernées)
//   npx medusa exec ./src/scripts/relink-inventory.ts <sku>      (une seule)
export default async function relinkInventory({ container, args }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const products = container.resolve(Modules.PRODUCT)
  const inventory = container.resolve(Modules.INVENTORY)

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "manage_inventory", "inventory_items.inventory_item_id"],
    filters: { manage_inventory: false, ...(args?.[0] ? { sku: args[0] } : {}) },
  })
  let fixed = 0
  for (const v of variants) {
    if (!v.sku || (v.inventory_items ?? []).length) continue
    const [item] = await inventory.listInventoryItems({ sku: v.sku })
    if (!item) continue // jamais géré en stock : rien à réparer
    await link.create({ [Modules.PRODUCT]: { variant_id: v.id }, [Modules.INVENTORY]: { inventory_item_id: item.id }, data: { required_quantity: 1 } })
    await products.updateProductVariants(v.id, { manage_inventory: true })
    logger.info(`Stock relié et gestion réactivée : ${v.sku}`)
    fixed++
  }
  logger.info(`${fixed} variante(s) réparée(s)`)
}
