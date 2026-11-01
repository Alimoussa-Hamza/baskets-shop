import type { MedusaContainer } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { lowestIn30Days, recordPrice, type PriceHistory } from "./price-reference"

// Relève le prix de BASE en euros de chaque variante (hors listes de prix soldés) et met à jour
// price_history + price_ref_30d dans ses métadonnées. La boutique ne barre un prix qu'avec ce price_ref_30d.
export async function recordAllPrices(container: MedusaContainer, today = new Date()): Promise<number> {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const products = container.resolve(Modules.PRODUCT)
  const { data } = await query.graph({
    entity: "product_variant",
    fields: ["id", "metadata", "prices.amount", "prices.currency_code", "prices.price_list_id", "prices.min_quantity"],
  })
  // Le type généré ne connaît pas le lien variante → prix (module pricing)
  const variants = data as unknown as { id: string; metadata: Record<string, unknown> | null; prices?: { amount: number; currency_code: string; price_list_id: string | null; min_quantity: number | null }[] }[]
  let n = 0
  for (const v of variants) {
    const base = v.prices?.find((p) => p.currency_code === "eur" && !p.price_list_id && !p.min_quantity)?.amount
    if (typeof base !== "number") continue
    const history = recordPrice(v.metadata?.price_history as PriceHistory | undefined, today, Number(base))
    await products.updateProductVariants(v.id, { metadata: { price_history: history, price_ref_30d: lowestIn30Days(history, today) } })
    n++
  }
  return n
}
