import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { isLive, readCampaign } from "../../../lib/campaign"

// Bandeau d'offre en cours (null si aucun, inactif ou terminé)
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { campaign } = await readCampaign(req.scope)
  res.json({ campaign: isLive(campaign) ? { text: campaign.text, link: campaign.link, ends_at: campaign.ends_at } : null })
}
