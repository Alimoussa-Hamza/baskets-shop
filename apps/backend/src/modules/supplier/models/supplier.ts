import { model } from "@medusajs/framework/utils"
import SupplierOrder from "./supplier-order"

const Supplier = model.define("supplier", {
  id: model.id({ prefix: "sup" }).primaryKey(),
  name: model.text(),
  country: model.text(),
  email: model.text(),
  vat_number: model.text().nullable(),
  lead_time_days: model.number().default(5),
  ships_from_eu: model.boolean().default(true),
  written_agreement_ref: model.text().nullable(),
  // Transmission des commandes : "email" (bon de commande envoyé à `email`) ou "cj" (API CJdropshipping).
  // Un fournisseur = un entrepôt : pour CJ, `country` est le pays de l'entrepôt d'expédition (ex. DE).
  integration: model.enum(["email", "cj"]).default("email"),
  logistic_name: model.text().nullable(), // transporteur imposé par l'API CJ (ex. « CJPacket Euro Ordinary »)
  active: model.boolean().default(true),
  orders: model.hasMany(() => SupplierOrder, { mappedBy: "supplier" }),
})

export default Supplier
