import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"
import type { z } from "zod"
import type { CampaignSchema } from "../../middlewares"
import { readCampaign } from "../../../lib/campaign"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  res.json({ campaign: (await readCampaign(req.scope)).campaign })
}

export async function POST(req: MedusaRequest<z.infer<typeof CampaignSchema>>, res: MedusaResponse) {
  const { storeId } = await readCampaign(req.scope)
  await req.scope.resolve(Modules.STORE).updateStores(storeId, { metadata: { campaign: req.validatedBody } })
  res.json({ campaign: (await readCampaign(req.scope)).campaign })
}
