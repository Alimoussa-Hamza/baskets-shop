import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WITHDRAWAL_MODULE } from "../../../../modules/withdrawal"
import type WithdrawalModuleService from "../../../../modules/withdrawal/service"
import type { z } from "zod"
import type { ConfirmWithdrawalSchema } from "../../../middlewares"

// ÉTAPE 2/2 : confirmation explicite -> accusé de réception horodaté (acknowledged_at).
export async function POST(req: MedusaRequest<z.infer<typeof ConfirmWithdrawalSchema>>, res: MedusaResponse) {
  const { id, email, scope, item_ids } = req.validatedBody
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
  // Rétractation partielle : les articles doivent appartenir à la commande (aucun identifiant arbitraire accepté)
  let choice: { scope: "full" | "partial"; item_ids: { ids: string[] } | null } = { scope: wd.scope, item_ids: wd.item_ids as { ids: string[] } | null }
  if (scope === "partial") {
    const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order", fields: ["items.id"], filters: { id: wd.order_id } })
    const valid = new Set((data[0]?.items ?? []).map((i) => i!.id))
    const ids = [...new Set(item_ids ?? [])].filter((x) => valid.has(x))
    if (ids.length === 0 || ids.length !== new Set(item_ids ?? []).size) {
      res.status(400).json({ message: "Choisissez au moins un article de la commande." })
      return
    }
    // Tous les articles cochés = rétractation totale
    choice = ids.length === valid.size ? { scope: "full", item_ids: null } : { scope: "partial", item_ids: { ids } }
  } else if (scope === "full") {
    choice = { scope: "full", item_ids: null }
  }
  const updated = await svc.updateWithdrawalRequests({ id, ...choice, status: "acknowledged", acknowledged_at: new Date() })
  // L accusé doit aussi être envoyé sur un support durable (e-mail) : événement consommé par le worker.
  await req.scope.resolve("event_bus").emit({ name: "withdrawal.acknowledged", data: { id: updated.id } })
  res.json({ id: updated.id, status: updated.status, acknowledged_at: updated.acknowledged_at })
}
