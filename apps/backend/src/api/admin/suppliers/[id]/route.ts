import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "zod"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"
import type { UpdateSupplierSchema } from "../../../middlewares"

// Pas de suppression : un fournisseur a un historique de commandes. On le désactive (active=false).
export async function POST(req: MedusaRequest<z.infer<typeof UpdateSupplierSchema>>, res: MedusaResponse) {
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  const current = await svc.retrieveSupplier(req.params.id)
  const next = { ...current, ...req.validatedBody }
  if (next.integration === "cj" && !next.logistic_name) {
    res.status(400).json({ type: "invalid_data", message: "Transporteur CJ obligatoire" })
    return
  }
  const supplier = await svc.updateSuppliers({ id: current.id, ...req.validatedBody })
  res.json({ supplier })
}
