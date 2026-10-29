// Garde-fous au démarrage du serveur (NODE_ENV=production) : la boutique refuse de démarrer avec une configuration
// dangereuse, par exemple un staging public ou une production en clés Stripe de test. APP_ENV : "staging" | "production".
// Les NEXT_PUBLIC_* sont écrites en toutes lettres : Next ne les remplace au build que sous cette forme.
export function register() {
  if (process.env.NODE_ENV !== "production") return
  const app = process.env.APP_ENV
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? ""
  const backend = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? ""
  const publishable = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
  const stripe = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
  const staging = process.env.STAGING_PASSWORD ?? ""

  const p: string[] = []
  if (app !== "staging" && app !== "production") p.push('APP_ENV doit valoir "staging" ou "production"')
  if (!site.startsWith("https://")) p.push("NEXT_PUBLIC_SITE_URL doit être une adresse https:// (fixée au build)")
  if (!backend.startsWith("https://")) p.push("NEXT_PUBLIC_MEDUSA_BACKEND_URL doit être une adresse https:// (fixée au build)")
  if (!/^pk_[a-f0-9]{20,}$/.test(publishable)) p.push("NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY absente ou valeur d'exemple (fixée au build)")
  if (!/^pk_(test|live)_\w{20,}$/.test(stripe)) p.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY absente : paiement par carte impossible (fixée au build)")
  if (app === "staging") {
    if (staging.length < 12) p.push("STAGING_PASSWORD obligatoire en staging (12 caractères minimum) : le site de test ne doit pas être public")
    if (stripe.startsWith("pk_live_")) p.push("Clé Stripe live interdite en staging")
  }
  if (app === "production") {
    if (staging) p.push("STAGING_PASSWORD doit être vide en production : la boutique serait fermée aux clients")
    if (!stripe.startsWith("pk_live_")) p.push("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY doit être une clé live (pk_live_…) en production")
  }
  if (p.length) throw new Error(`Configuration refusée (${app ?? "APP_ENV absent"}) :\n- ${p.join("\n- ")}`)
}
