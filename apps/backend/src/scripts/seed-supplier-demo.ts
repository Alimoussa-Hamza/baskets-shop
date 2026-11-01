import type { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../modules/supplier"
import type SupplierModuleService from "../modules/supplier/service"
import { LEGACY_SUPPLIER_METADATA } from "../lib/supplier-lines"

// Fournisseur de DÉMO (transmission par e-mail, visible dans Mailpit) relié à toutes les variantes du catalogue,
// avec un prix d'achat fictif à 40 % du prix de vente HT. Idempotent. Purge aussi les anciennes clés supplier_*
// des métadonnées des variantes (exposées par l'API publique avant la table supplier_variant). Usage :
//   npx medusa exec ./src/scripts/seed-supplier-demo.ts
// Refuse de tourner en production.
export default async function seedSupplierDemo({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production") throw new Error("Interdit en production")
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const svc: SupplierModuleService = container.resolve(SUPPLIER_MODULE)
  const name = "Fournisseur démo (e-mail)"
  const supplier = (await svc.listSuppliers({ name }))[0] ?? await svc.createSuppliers({
    name, country: "fr", email: "fournisseur.demo@example.com", integration: "email", lead_time_days: 3,
    written_agreement_ref: "DÉMO – aucun accord réel",
  })

  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const { data } = await query.graph({ entity: "product_variant", fields: ["id", "sku", "prices.amount", "prices.currency_code"] })
  // Le type généré ne connaît pas le lien variante → prix (module pricing) ; les montants sont en euros.
  const variants = data as unknown as { id: string; sku: string | null; prices?: { amount: number; currency_code: string }[] }[]
  const existing = await svc.listSupplierVariants({}, { select: ["id"] })
  if (existing.length) await svc.deleteSupplierVariants(existing.map((e) => e.id))
  await svc.createSupplierVariants(variants.map((v) => {
    const price = v.prices?.find((p) => p?.currency_code === "eur")?.amount
    return { variant_id: v.id, supplier_id: supplier.id, sku: v.sku ?? v.id, cost_cents: typeof price === "number" ? Math.round((price / 1.2) * 0.4 * 100) : null }
  }))
  const productModule = container.resolve(Modules.PRODUCT)
  for (const v of variants) await productModule.updateProductVariants(v.id, { metadata: LEGACY_SUPPLIER_METADATA })
  logger.info(`${name} (${supplier.id}) relié à ${variants.length} variantes`)
}
