import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

// Un produit change dans l'admin (publication, prix, photos, variantes) : la boutique vide son cache catalogue
// (sinon jusqu'à 5 minutes de décalage). Jamais bloquant : un échec est seulement journalisé.
export default async function handler({ event, container }: SubscriberArgs<{ id: string }>) {
  const url = process.env.STOREFRONT_URL, secret = process.env.REVALIDATE_SECRET
  if (!url || !secret) return
  try {
    const res = await fetch(`${url}/api/revalidate`, { method: "POST", headers: { "x-revalidate-secret": secret }, signal: AbortSignal.timeout(5_000) })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
  } catch (e) {
    container.resolve(ContainerRegistrationKeys.LOGGER).warn(`[cache boutique] ${event.name} non propagé : ${(e as Error).message}`)
  }
}

export const config: SubscriberConfig = {
  event: ["product.created", "product.updated", "product.deleted", "product-variant.created", "product-variant.updated", "product-variant.deleted"],
}
