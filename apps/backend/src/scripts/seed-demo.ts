import type { ExecArgs } from "@medusajs/framework/types"
import {
  ContainerRegistrationKeys,
  Modules,
  ProductStatus,
} from "@medusajs/framework/utils"
import {
  createApiKeysWorkflow,
  createInventoryLevelsWorkflow,
  createProductCategoriesWorkflow,
  createProductsWorkflow,
  createRegionsWorkflow,
  createShippingOptionsWorkflow,
  createShippingProfilesWorkflow,
  createStockLocationsWorkflow,
  createTaxRegionsWorkflow,
  linkSalesChannelsToApiKeyWorkflow,
  linkSalesChannelsToStockLocationWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows"

// Données de DÉMO (aucune marque réelle, pas de GTIN inventé). Idempotent : relançable sans doublons.
//   npx medusa exec ./src/scripts/seed-demo.ts
// Refuse de tourner en production.

const SIZES_W = ["36", "37", "38", "39", "40", "41"]
const SIZES_M = ["40", "41", "42", "43", "44", "45"]

// Longueur de pied (cm) approximative par pointure EU, pour le guide des tailles [H : à remplacer par les tables fabricant]
const FOOT_CM: Record<string, number> = { "36": 22.8, "37": 23.5, "38": 24.1, "39": 24.8, "40": 25.4, "41": 26.1, "42": 26.7, "43": 27.4, "44": 28.0, "45": 28.7 }

type Demo = {
  handle: string; title: string; collection: string; gender: "female" | "male"; category: string
  colors: string[]; price: number; description: string; fit: string
}

const DEMOS: Demo[] = [
  { handle: "heritage-black", title: "Heritage Black", collection: "Collection Urbaine", gender: "male", category: "urbaines", colors: ["Noir", "Blanc", "Bleu"], price: 139, fit: "Taille normalement.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
  { handle: "heritage-navy", title: "Heritage Navy", collection: "Collection Urbaine", gender: "female", category: "urbaines", colors: ["Bleu", "Blanc"], price: 139, fit: "Taille normalement.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
  { handle: "urban-peak", title: "Urban Peak", collection: "Montantes", gender: "female", category: "montantes", colors: ["Gris"], price: 149, fit: "Taille petit : prendre une pointure au-dessus.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
  { handle: "white-essence", title: "White Essence", collection: "Collection Urbaine", gender: "female", category: "urbaines", colors: ["Blanc", "Noir"], price: 119, fit: "Taille normalement.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
  { handle: "minimal-beige", title: "Minimal Beige", collection: "Essentials", gender: "female", category: "urbaines", colors: ["Beige"], price: 99, fit: "Taille normalement.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
  { handle: "stride-run", title: "Stride Run", collection: "Performance", gender: "male", category: "running", colors: ["Noir", "Bleu"], price: 159, fit: "Taille grand : prendre une demi-pointure en dessous.", description: "Modèle de démonstration. Texte à rédiger par vos soins à partir de l'échantillon reçu." },
]

export default async function seedDemo({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production") throw new Error("Interdit en production")
  const log = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const link = container.resolve(ContainerRegistrationKeys.LINK)
  const storeModule = container.resolve(Modules.STORE)
  const salesChannelModule = container.resolve(Modules.SALES_CHANNEL)
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const pricingModule = container.resolve(Modules.PRICING)

  // --- Boutique, devise, canal de vente
  const [store] = await storeModule.listStores()
  let [channel] = await salesChannelModule.listSalesChannels({ name: "Boutique en ligne" })
  if (!channel) {
    ;[channel] = await salesChannelModule.listSalesChannels({ name: "Default Sales Channel" })
    if (channel) await salesChannelModule.updateSalesChannels(channel.id, { name: "Boutique en ligne" })
    else {
      channel = await salesChannelModule.createSalesChannels({ name: "Boutique en ligne" })
    }
  }
  await updateStoresWorkflow(container).run({
    input: { selector: { id: store.id }, update: { supported_currencies: [{ currency_code: "eur", is_default: true }], default_sales_channel_id: channel.id } },
  })

  // --- Région : France seule pour l'instant (la TVA des autres pays UE / guichet OSS dépend du statut juridique, non choisi)
  const { data: regions } = await query.graph({ entity: "region", fields: ["id", "name"], filters: { name: "France" } })
  let regionId = regions[0]?.id as string | undefined
  if (!regionId) {
    const { result } = await createRegionsWorkflow(container).run({
      // Stripe seulement si ses clés sont configurées (sinon le fournisseur n'est pas chargé)
      input: { regions: [{ name: "France", currency_code: "eur", countries: ["fr"], payment_providers: ["pp_system_default", ...(process.env.STRIPE_API_KEY ? ["pp_stripe_stripe"] : [])] }] },
    })
    regionId = result[0].id
  }

  // TVA France (idempotent)
  const taxModule = container.resolve(Modules.TAX)
  const taxRegions = await taxModule.listTaxRegions({ country_code: "fr" })
  if (!taxRegions.length) {
    await createTaxRegionsWorkflow(container).run({
      input: [{ country_code: "fr", provider_id: "tp_system", default_tax_rate: { rate: 20, code: "TVA20", name: "TVA 20 %" } }],
    })
  }
  // Prix affichés TTC pour l'EUR (idempotent : la préférence peut déjà exister)
  // Medusa crée aussi une préférence « hors taxe » liée à la région : elle l'emporte pour les prix de livraison
  // (constaté : 5,90 € devenait 7,08 €). Il faut donc forcer le TTC sur la devise ET sur la région.
  for (const [attribute, value] of [["currency_code", "eur"], ["region_id", regionId]] as const) {
    const prefs = await pricingModule.listPricePreferences({ attribute, value })
    if (prefs.length) await pricingModule.updatePricePreferences(prefs[0].id, { is_tax_inclusive: true })
    else await pricingModule.createPricePreferences({ attribute, value, is_tax_inclusive: true })
  }

  // --- Stock : dépôt fictif « fournisseur UE »
  const { data: locs } = await query.graph({ entity: "stock_location", fields: ["id", "name"], filters: { name: "Fournisseur UE (dropshipping)" } })
  let locationId = locs[0]?.id as string | undefined
  if (!locationId) {
    const { result } = await createStockLocationsWorkflow(container).run({
      input: { locations: [{ name: "Fournisseur UE (dropshipping)", address: { city: "Porto", country_code: "PT", address_1: "" } }] },
    })
    locationId = result[0].id
    await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: locationId }, [Modules.FULFILLMENT]: { fulfillment_provider_id: "manual_manual" } })
    await linkSalesChannelsToStockLocationWorkflow(container).run({ input: { id: locationId, add: [channel.id] } })

    // --- Expédition
    const [profile] = await fulfillmentModule.listShippingProfiles({ type: "default" })
    const shippingProfile = profile ?? (await createShippingProfilesWorkflow(container).run({ input: { data: [{ name: "Profil par défaut", type: "default" }] } })).result[0]
    const fset = await fulfillmentModule.createFulfillmentSets({
      name: "Livraison France",
      type: "shipping",
      service_zones: [{ name: "France", geo_zones: [{ country_code: "fr", type: "country" }] }],
    })
    await link.create({ [Modules.STOCK_LOCATION]: { stock_location_id: locationId }, [Modules.FULFILLMENT]: { fulfillment_set_id: fset.id } })
    const rules = [{ attribute: "enabled_in_store", value: "true", operator: "eq" as const }, { attribute: "is_return", value: "false", operator: "eq" as const }]
    await createShippingOptionsWorkflow(container).run({
      input: [{
        name: "Livraison standard (2 à 4 jours ouvrés)", price_type: "flat", provider_id: "manual_manual",
        service_zone_id: fset.service_zones[0].id, shipping_profile_id: shippingProfile.id,
        type: { label: "Standard", description: "2 à 4 jours ouvrés", code: "standard" },
        // Gratuite dès 150 € (seuil des maquettes : décision commerciale à confirmer)
        prices: [
          { currency_code: "eur", amount: 5.9 },
          { region_id: regionId, amount: 5.9 },
          { currency_code: "eur", amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 150 }] },
          { region_id: regionId, amount: 0, rules: [{ attribute: "item_total", operator: "gte", value: 150 }] },
        ],
        rules,
      }],
    })
    log.info("Dépôt, zone France et livraison standard créés")
  }

  // --- Clé publiable liée au canal
  const { data: keys } = await query.graph({ entity: "api_key", fields: ["id", "token", "title"], filters: { title: "storefront-local" } })
  let key = keys[0]
  if (!key) {
    const { result } = await createApiKeysWorkflow(container).run({ input: { api_keys: [{ title: "storefront-local", type: "publishable", created_by: "" }] } })
    key = result[0] as any
  }
  await linkSalesChannelsToApiKeyWorkflow(container).run({ input: { id: key.id, add: [channel.id] } }).catch(() => undefined)

  // --- Catégories
  const wanted = [{ name: "Running", handle: "running" }, { name: "Urbaines", handle: "urbaines" }, { name: "Montantes", handle: "montantes" }]
  const { data: cats } = await query.graph({ entity: "product_category", fields: ["id", "handle"] })
  const catId: Record<string, string> = Object.fromEntries(cats.map((c: any) => [c.handle, c.id]))
  const missing = wanted.filter((w) => !catId[w.handle])
  if (missing.length) {
    const { result } = await createProductCategoriesWorkflow(container).run({ input: { product_categories: missing.map((m) => ({ ...m, is_active: true })) } })
    result.forEach((c: any) => (catId[c.handle] = c.id))
  }

  // --- Produits
  const [profile] = await fulfillmentModule.listShippingProfiles({ type: "default" })
  const { data: existing } = await query.graph({ entity: "product", fields: ["handle"] })
  const have = new Set(existing.map((p: any) => p.handle))
  const toCreate = DEMOS.filter((d) => !have.has(d.handle))
  if (toCreate.length) {
    await createProductsWorkflow(container).run({
      input: {
        products: toCreate.map((d) => {
          const sizes = d.gender === "female" ? SIZES_W : SIZES_M
          return {
            title: d.title, handle: d.handle, subtitle: d.collection, description: d.description,
            status: ProductStatus.PUBLISHED, shipping_profile_id: profile.id,
            category_ids: [catId[d.category]],
            sales_channels: [{ id: channel.id }],
            options: [{ title: "Taille", values: sizes }, { title: "Couleur", values: d.colors }],
            // Champs Merchant Center (même source que le site). GTIN/MPN : à saisir depuis le fournisseur.
            metadata: { gender: d.gender, age_group: "adult", brand: "Marque démo", fit_note: d.fit, item_group_id: d.handle },
            variants: d.colors.flatMap((color) => sizes.map((size) => ({
              title: `${size} / ${color}`,
              sku: `${d.handle}-${size}-${color}`.toLowerCase().replace(/[^a-z0-9-]/g, ""),
              manage_inventory: true,
              options: { Taille: size, Couleur: color },
              metadata: { foot_length_cm: FOOT_CM[size], mpn: null, gtin: null },
              prices: [{ currency_code: "eur", amount: d.price }],
            }))),
          }
        }),
      },
    })
    log.info(`${toCreate.length} produits créés`)
  }

  // --- Stock : 12 paires par variante, 2 sur la plus grande taille (pour tester « Plus que 2 »)
  const { data: items } = await query.graph({
    entity: "inventory_item",
    fields: ["id", "sku", "location_levels.id"],
  })
  const fresh = items.filter((i: any) => !i.location_levels?.length)
  if (fresh.length) {
    await createInventoryLevelsWorkflow(container).run({
      input: {
        inventory_levels: fresh.map((i: any) => ({
          location_id: locationId!, inventory_item_id: i.id,
          stocked_quantity: /-(41|45)-/.test(i.sku ?? "") ? 2 : 12,
        })),
      },
    })
    log.info(`Stock créé pour ${fresh.length} variantes`)
  }

  log.info(`Clé publiable : ${key.token}`)
}
