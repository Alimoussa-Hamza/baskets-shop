import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { WITHDRAWAL_MODULE } from "../modules/withdrawal"
import type WithdrawalModuleService from "../modules/withdrawal/service"
import { withdrawalAck } from "../lib/emails"

// Accusé de réception sur support durable (e-mail) : au client, copie cachée à la boutique.
// En cas d échec d envoi l erreur remonte (loguée). La demande reste enregistrée, mais le rejeu automatique n est PAS vérifié : à tester (SMTP coupé) avant la mise en ligne.
export default async function handler({ event, container }: SubscriberArgs<{ id: string }>) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const svc: WithdrawalModuleService = container.resolve(WITHDRAWAL_MODULE)
  const wd = await svc.retrieveWithdrawalRequest(event.data.id)
  if (!wd.acknowledged_at) return

  let titles: string[] = []
  const ids = (wd.item_ids as { ids?: string[] } | null)?.ids
  if (wd.scope === "partial" && ids?.length) {
    const query = container.resolve(ContainerRegistrationKeys.QUERY)
    const { data } = await query.graph({ entity: "order_line_item", fields: ["id", "title"], filters: { id: ids } })
    titles = data.map((i: { title: string }) => i.title)
  }

  if (!process.env.SMTP_HOST) {
    logger.warn(`[rétractation] ${wd.id} enregistrée mais aucun e-mail envoyé : SMTP non configuré (obligatoire en production)`)
    return
  }
  const mail = withdrawalAck({ reference: wd.id, orderDisplayId: Number(wd.order_display_id), acknowledgedAt: wd.acknowledged_at, scope: wd.scope, itemTitles: titles })
  const notification = container.resolve(Modules.NOTIFICATION)
  await notification.createNotifications({
    to: wd.email, channel: "email", template: "withdrawal-acknowledged",
    content: mail, data: { withdrawal_id: wd.id },
    provider_data: process.env.SHOP_NOTIFY_EMAIL ? { bcc: process.env.SHOP_NOTIFY_EMAIL } : undefined,
  })
  logger.info(`[rétractation] accusé ${wd.id} envoyé pour la commande #${wd.order_display_id}`)
}

export const config: SubscriberConfig = { event: "withdrawal.acknowledged" }
