import { model } from "@medusajs/framework/utils"

// Demande de rétractation (art. L221-21 Code de la consommation, depuis le 19/06/2026)
const WithdrawalRequest = model.define("withdrawal_request", {
  id: model.id({ prefix: "wdr" }).primaryKey(),
  order_id: model.text().index("IDX_withdrawal_order_id"),
  order_display_id: model.number(),
  email: model.text(),
  scope: model.enum(["full", "partial"]).default("full"),
  item_ids: model.json().nullable(),
  status: model.enum(["draft", "acknowledged", "processed", "rejected"]).default("draft"),
  submitted_at: model.dateTime(),
  acknowledged_at: model.dateTime().nullable(),
  note: model.text().nullable(),
})

export default WithdrawalRequest
