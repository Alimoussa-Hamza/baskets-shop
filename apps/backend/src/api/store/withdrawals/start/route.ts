import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { WITHDRAWAL_MODULE } from "../../../../modules/withdrawal"
import type WithdrawalModuleService from "../../../../modules/withdrawal/service"
import type { z } from "zod"
import type { StartWithdrawalSchema } from "../../../middlewares"

// ÉTAPE 1/2 : le client saisit n° de commande + e-mail (sans compte) -> brouillon + récapitulatif.
export async function POST(req: MedusaRequest<z.infer<typeof StartWithdrawalSchema>>, res: MedusaResponse) {
  const { order_display_id, email, scope, item_ids } = req.validatedBody
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({
    entity: "order",
    fields: ["id", "display_id", "email", "items.id", "items.title", "items.variant_title", "items.quantity"],
    // Les types générés donnent display_id en string ; en base c'est un entier auto-incrémenté (testé).
    filters: { display_id: order_display_id as unknown as string },
  })
  const order = data[0]
  // Réponse identique si commande absente ou e-mail différent : pas d énumération de commandes.
  if (!order || order.email?.toLowerCase() !== email.toLowerCase()) {
    res.status(404).json({ message: "Aucune commande correspondante." })
    return
  }
  const svc: WithdrawalModuleService = req.scope.resolve(WITHDRAWAL_MODULE)
  const draft = await svc.createWithdrawalRequests({
    order_id: order.id,
    order_display_id: Number(order.display_id),
    email: order.email!,
    scope,
    item_ids: scope === "partial" ? { ids: item_ids ?? [] } : null,
    status: "draft",
    submitted_at: new Date(),
  })
  // Articles déjà couverts par une rétractation confirmée : signalés pour éviter une double demande
  const done = await svc.listWithdrawalRequests({ order_id: order.id, status: ["acknowledged", "processed"] })
  const allItemIds = (order.items ?? []).map((i) => i!.id)
  const withdrawn = new Set(done.flatMap((w) => (w.scope === "full" ? allItemIds : ((w.item_ids as { ids?: string[] } | null)?.ids ?? []))))
  res.status(201).json({
    id: draft.id,
    order_display_id: Number(order.display_id),
    scope,
    items: (order.items ?? []).filter((i) => scope === "full" || item_ids?.includes(i!.id)).map((i) => ({
      id: i!.id, title: i!.title, variant: i!.variant_title ?? null, quantity: Number(i!.quantity), already_withdrawn: withdrawn.has(i!.id),
    })),
  })
}
