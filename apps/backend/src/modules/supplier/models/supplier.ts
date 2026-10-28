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
  active: model.boolean().default(true),
  orders: model.hasMany(() => SupplierOrder, { mappedBy: "supplier" }),
})

export default Supplier
