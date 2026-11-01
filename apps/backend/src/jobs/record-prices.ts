import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recordAllPrices } from "../lib/price-recorder"

// Chaque nuit : relevé des prix de base, pour des prix barrés conformes à la règle des 30 jours.
export default async function recordPricesJob(container: MedusaContainer) {
  const n = await recordAllPrices(container)
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`[prix] relevé quotidien : ${n} variantes`)
}

export const config = { name: "record-prices", schedule: "0 3 * * *" }
