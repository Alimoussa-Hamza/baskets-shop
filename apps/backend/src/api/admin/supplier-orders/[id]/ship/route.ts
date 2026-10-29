import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "zod"
import type { ShipSupplierOrderSchema } from "../../../../middlewares"
import { markSupplierOrderShipped } from "../../../../../lib/supplier-dispatch"

// Saisie du numéro de suivi reçu du fournisseur : statut « expédiée » + e-mail au client.
export async function POST(req: MedusaRequest<z.infer<typeof ShipSupplierOrderSchema>>, res: MedusaResponse) {
  const { tracking_number, carrier } = req.validatedBody
  const spo = await markSupplierOrderShipped(req.scope, req.params.id, { number: tracking_number, carrier })
  res.json({ supplier_order: { id: spo.id, status: spo.status, tracking_number: spo.tracking_number, carrier: spo.carrier } })
}
