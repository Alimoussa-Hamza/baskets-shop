import type { MedusaContainer } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Bandeau d'offre stocké dans les métadonnées de la boutique Medusa (un seul à la fois).
export type Campaign = { active: boolean; text: string; link?: string | null; ends_at?: string | null }

export async function readCampaign(container: MedusaContainer): Promise<{ storeId: string; campaign: Campaign }> {
  const [store] = await container.resolve(Modules.STORE).listStores({}, { select: ["id", "metadata"] })
  const c = (store.metadata?.campaign ?? {}) as Partial<Campaign>
  return { storeId: store.id, campaign: { active: !!c.active, text: c.text ?? "", link: c.link ?? null, ends_at: c.ends_at ?? null } }
}

/** Visible côté boutique : actif, avec un texte, et pas encore terminé. */
export const isLive = (c: Campaign, now = new Date()) => c.active && !!c.text && (!c.ends_at || new Date(c.ends_at) > now)
