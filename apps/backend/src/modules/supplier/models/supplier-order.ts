import { model } from "@medusajs/framework/utils"
import Supplier from "./supplier"

const SupplierOrder = model.define("supplier_order", {
  id: model.id({ prefix: "spo" }).primaryKey(),
  order_id: model.text().index("IDX_supplier_order_order_id"),
  status: model.enum(["to_place", "placed", "shipped", "delivered", "cancelled"]).default("to_place"),
  supplier_reference: model.text().nullable(),
  tracking_number: model.text().nullable(),
  cost_total_cents: model.number().nullable(),
  placed_at: model.dateTime().nullable(),
  supplier: model.belongsTo(() => Supplier, { mappedBy: "orders" }),
})

export default SupplierOrder
