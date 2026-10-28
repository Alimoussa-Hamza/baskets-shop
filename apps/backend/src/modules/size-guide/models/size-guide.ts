import { model } from "@medusajs/framework/utils"

// Table longueur de pied (cm) -> pointure EU, par marque / modèle
const SizeGuide = model.define("size_guide", {
  id: model.id({ prefix: "sgd" }).primaryKey(),
  handle: model.text().unique(),
  title: model.text(),
  brand: model.text().nullable(),
  gender: model.enum(["female", "male", "unisex"]).default("unisex"),
  rows: model.json(),
  fit_note: model.text().nullable(),
})

export default SizeGuide
