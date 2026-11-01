import { model } from "@medusajs/framework/utils"
import Supplier from "./supplier"

// Lien variante → fournisseur, avec la référence et le prix d'achat. Table privée du module : contrairement aux
// métadonnées des variantes, l'API publique de la boutique (/store/products) n'y a pas accès.
const SupplierVariant = model.define("supplier_variant", {
  id: model.id({ prefix: "spv" }).primaryKey(),
  variant_id: model.text().unique("IDX_supplier_variant_variant_id"),
  sku: model.text().nullable(), // référence chez le fournisseur (pour CJ : l'id de variante « vid »)
  cost_cents: model.number().nullable(), // prix d'achat unitaire HT, en centimes (calcul de marge)
  supplier: model.belongsTo(() => Supplier, { mappedBy: "variants" }),
})

export default SupplierVariant
