import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { WITHDRAWAL_MODULE } from "../../../../modules/withdrawal"
import type WithdrawalModuleService from "../../../../modules/withdrawal/service"
import type { z } from "zod"
import type { ConfirmWithdrawalSchema } from "../../../middlewares"

// ÉTAPE 2/2 : confirmation explicite -> accusé de réception horodaté (acknowledged_at).
export async function POST(req: MedusaRequest<z.infer<typeof ConfirmWithdrawalSchema>>, res: MedusaResponse) {
  const { id, email } = req.validatedBody
  const svc: WithdrawalModuleService = req.scope.resolve(WITHDRAWAL_MODULE)
  const [wd] = await svc.listWithdrawalRequests({ id })
  if (!wd || wd.email.toLowerCase() !== email.toLowerCase()) {
    res.status(404).json({ message: "Demande introuvable." })
    return
  }
  if (wd.status !== "draft") {
    // idempotent : rejouer la confirmation renvoie le même accusé
    res.json({ id: wd.id, status: wd.status, acknowledged_at: wd.acknowledged_at })
    return
  }
  const updated = await svc.updateWithdrawalRequests({ id, status: "acknowledged", acknowledged_at: new Date() })
  // L accusé doit aussi être envoyé sur un support durable (e-mail) : événement consommé par le worker.
  await req.scope.resolve("event_bus").emit({ name: "withdrawal.acknowledged", data: { id: updated.id } })
  res.json({ id: updated.id, status: updated.status, acknowledged_at: updated.acknowledged_at })
}
