import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { syncCjStock } from "../lib/cj-stock-sync"

// Toutes les 6 heures : stock CJ → boutique (aucun effet sans CJ_API_KEY).
export default async function syncCjStockJob(container: MedusaContainer) {
  const r = await syncCjStock(container)
  if (r.updated || r.failed) container.resolve(ContainerRegistrationKeys.LOGGER).info(`[stock CJ] ${r.updated} variantes à jour, ${r.failed} en échec`)
}

export const config = { name: "sync-cj-stock", schedule: "15 */6 * * *" }
