import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../../modules/supplier"
import type SupplierModuleService from "../../../../../modules/supplier/service"
import { dispatchSupplierOrder } from "../../../../../lib/supplier-dispatch"

// Relance la transmission d'une commande restée « à passer » (ex. clé API ou SMTP corrigés entre-temps).
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  await dispatchSupplierOrder(req.scope, req.params.id)
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  const spo = await svc.retrieveSupplierOrder(req.params.id)
  res.json({ supplier_order: { id: spo.id, status: spo.status, last_error: spo.last_error } })
}
