import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { z } from "zod"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import { LEGACY_SUPPLIER_METADATA } from "../../../../../lib/supplier-lines"
import type { ProductSupplierSchema } from "../../../../middlewares"

// Lien produit → fournisseur, rangé dans la table privée supplier_variant (voir src/lib/supplier-lines.ts).
// Les anciennes clés de métadonnées des variantes (visibles par l'API publique) sont purgées à chaque enregistrement.

const variantIds = async (req: MedusaRequest) =>
  (await req.scope.resolve(Modules.PRODUCT).listProductVariants({ product_id: req.params.id }, { select: ["id"] })).map((v) => v.id)

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const ids = await variantIds(req)
  const rows = ids.length ? await (req.scope.resolve(SUPPLIER_MODULE) as SupplierModuleService).listSupplierVariants({ variant_id: ids }, { relations: ["supplier"] }) : []
  res.json({
    supplier_id: rows[0]?.supplier.id ?? null,
    variants: rows.map((r) => ({ variant_id: r.variant_id, supplier_sku: r.sku, supplier_cost_cents: r.cost_cents })),
  })
}

export async function POST(req: MedusaRequest<z.infer<typeof ProductSupplierSchema>>, res: MedusaResponse) {
  const { supplier_id, variants } = req.validatedBody
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  if (supplier_id) await svc.retrieveSupplier(supplier_id) // 404 si inconnu
  const ids = await variantIds(req)
  const byId = new Map(variants.map((v) => [v.id, v]))
  const old = ids.length ? await svc.listSupplierVariants({ variant_id: ids }, { select: ["id"] }) : []
  if (old.length) await svc.deleteSupplierVariants(old.map((o) => o.id))
  if (supplier_id && ids.length) await svc.createSupplierVariants(ids.map((id) => ({
    variant_id: id, supplier_id, sku: byId.get(id)?.supplier_sku || null, cost_cents: byId.get(id)?.supplier_cost_cents ?? null,
  })))
  const products = req.scope.resolve(Modules.PRODUCT)
  await Promise.all(ids.map((id) => products.updateProductVariants(id, { metadata: LEGACY_SUPPLIER_METADATA })))
  res.json({ updated: ids.length })
}
