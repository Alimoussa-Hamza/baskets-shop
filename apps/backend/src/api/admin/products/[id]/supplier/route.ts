import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { z } from "zod"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import type { ProductSupplierSchema } from "../../../../middlewares"

// Lien produit → fournisseur, porté par les métadonnées des variantes (voir src/lib/supplier-lines.ts).
// Medusa FUSIONNE les métadonnées : seules nos clés sont envoyées, et "" supprime une clé (convention Medusa).
export async function POST(req: MedusaRequest<z.infer<typeof ProductSupplierSchema>>, res: MedusaResponse) {
  const { supplier_id, variants } = req.validatedBody
  if (supplier_id) await (req.scope.resolve(SUPPLIER_MODULE) as SupplierModuleService).retrieveSupplier(supplier_id) // 404 si inconnu
  const products = req.scope.resolve(Modules.PRODUCT)
  const existing = await products.listProductVariants({ product_id: req.params.id }, { select: ["id"] })
  const byId = new Map(variants.map((v) => [v.id, v]))
  const updated = await Promise.all(existing.map((v) => {
    const input = supplier_id ? byId.get(v.id) : undefined
    return products.updateProductVariants(v.id, { metadata: {
      supplier_id: supplier_id ?? "",
      supplier_sku: input?.supplier_sku || "",
      supplier_cost_cents: input?.supplier_cost_cents ?? "",
    } })
  }))
  res.json({ updated: updated.length })
}
