// Garde-fous de configuration : en ligne (NODE_ENV=production), le backend refuse de démarrer si la
// configuration est dangereuse ou incomplète, au lieu de tourner sans e-mails ou avec des clés de test.
// APP_ENV distingue l'environnement de test en ligne (staging) de la vraie production.

type Env = Record<string, string | undefined>

const PLACEHOLDER = /generer|change-me|build-only|xxx/i
const https = (v?: string) => !!v && v.split(",").every((u) => u.trim().startsWith("https://"))

export function productionEnvProblems(env: Env): string[] {
  if (env.NODE_ENV !== "production") return []
  const p: string[] = []
  const app = env.APP_ENV
  if (app !== "staging" && app !== "production") p.push('APP_ENV doit valoir "staging" ou "production"')

  for (const k of ["JWT_SECRET", "COOKIE_SECRET"]) {
    const v = env[k] ?? ""
    if (v.length < 32 || PLACEHOLDER.test(v)) p.push(`${k} trop court ou valeur d'exemple (32 caractères minimum : openssl rand -hex 32)`)
  }
  if (env.JWT_SECRET && env.JWT_SECRET === env.COOKIE_SECRET) p.push("JWT_SECRET et COOKIE_SECRET doivent être différents")

  // Accusé de rétractation sur support durable : légalement requis, donc e-mails obligatoires en ligne
  for (const k of ["SMTP_HOST", "SMTP_PORT", "MAIL_FROM"]) if (!env[k]) p.push(`${k} manquant : les e-mails (dont l'accusé de rétractation, obligatoire) ne partiraient pas`)
  for (const k of ["STRIPE_API_KEY", "STRIPE_WEBHOOK_SECRET"]) if (!env[k]) p.push(`${k} manquant : paiement par carte impossible`)

  for (const k of ["STORE_CORS", "ADMIN_CORS", "AUTH_CORS"]) {
    if (env[k]?.includes("*")) p.push(`${k} contient « * » : origines exactes uniquement`)
    else if (!https(env[k])) p.push(`${k} doit contenir uniquement des adresses https://`)
  }
  if (!https(env.MEDUSA_BACKEND_URL)) p.push("MEDUSA_BACKEND_URL doit être une adresse https://")

  if (app === "production") {
    if (!env.STRIPE_API_KEY?.startsWith("sk_live_")) p.push("STRIPE_API_KEY doit être une clé live (sk_live_…) en production")
    if (env.CJ_SANDBOX === "1") p.push("CJ_SANDBOX=1 interdit en production (commandes fournisseur fictives)")
    if (!env.SHOP_LEGAL_LINE) p.push("SHOP_LEGAL_LINE manquant : raison sociale, SIRET et adresse dans les e-mails")
    if (!env.SHOP_NOTIFY_EMAIL) p.push("SHOP_NOTIFY_EMAIL manquant : la boutique ne recevrait pas de copie des commandes")
  }
  if (app === "staging" && env.STRIPE_API_KEY?.startsWith("sk_live_")) p.push("Clé Stripe live interdite en staging : utiliser les clés de test")
  return p
}

export function assertProductionEnv(env: Env = process.env): void {
  const problems = productionEnvProblems(env)
  if (problems.length) throw new Error(`Configuration refusée (${env.APP_ENV ?? "APP_ENV absent"}) :\n- ${problems.join("\n- ")}`)
}
