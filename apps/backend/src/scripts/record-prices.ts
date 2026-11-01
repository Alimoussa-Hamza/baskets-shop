import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { recordAllPrices } from "../lib/price-recorder"

// Relevé des prix à la demande (sinon chaque nuit à 3 h) : npx medusa exec ./src/scripts/record-prices.ts
export default async function recordPrices({ container }: ExecArgs) {
  const n = await recordAllPrices(container)
  container.resolve(ContainerRegistrationKeys.LOGGER).info(`Prix relevés pour ${n} variantes`)
}
