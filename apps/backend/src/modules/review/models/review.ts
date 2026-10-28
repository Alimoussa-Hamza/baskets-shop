import { model } from "@medusajs/framework/utils"

const Review = model.define("review", {
  id: model.id({ prefix: "rev" }).primaryKey(),
  product_id: model.text().index("IDX_review_product_id"),
  rating: model.number(),
  title: model.text().nullable(),
  body: model.text(),
  author_name: model.text(),
  verified_purchase: model.boolean().default(false),
  order_id: model.text().nullable(),
  status: model.enum(["pending", "approved", "rejected"]).default("pending"),
  moderated_at: model.dateTime().nullable(),
})

export default Review
