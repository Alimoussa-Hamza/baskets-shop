import test from "node:test"
import assert from "node:assert/strict"
import { productionEnvProblems } from "./env-guards.ts"

const secret = (c: string) => c.repeat(64)
const staging = {
  NODE_ENV: "production", APP_ENV: "staging",
  JWT_SECRET: secret("a"), COOKIE_SECRET: secret("b"),
  SMTP_HOST: "smtp.resend.com", SMTP_PORT: "465", MAIL_FROM: "boutique@exemple.fr",
  STRIPE_API_KEY: "sk_test_123", STRIPE_WEBHOOK_SECRET: "whsec_123",
  STORE_CORS: "https://shop.exemple.fr", ADMIN_CORS: "https://api.exemple.fr", AUTH_CORS: "https://api.exemple.fr,https://shop.exemple.fr",
  MEDUSA_BACKEND_URL: "https://api.exemple.fr",
}

test("aucune vérification hors production (local, build)", () => {
  assert.deepEqual(productionEnvProblems({ NODE_ENV: "development" }), [])
  assert.deepEqual(productionEnvProblems({}), [])
})

test("staging complet accepté, avec clés Stripe de test", () => {
  assert.deepEqual(productionEnvProblems(staging), [])
})

test("refuse secrets d'exemple, e-mails absents, CORS joker ou http", () => {
  const p = productionEnvProblems({ ...staging, JWT_SECRET: "generer-avec-openssl-rand-hex-32", SMTP_HOST: "", STORE_CORS: "*", ADMIN_CORS: "http://api.exemple.fr" })
  assert.equal(p.length, 4)
  assert.match(p.join(" "), /JWT_SECRET/)
  assert.match(p.join(" "), /SMTP_HOST/)
  assert.match(p.join(" "), /STORE_CORS contient/)
  assert.match(p.join(" "), /ADMIN_CORS doit/)
})

test("APP_ENV obligatoire, clé live interdite en staging", () => {
  assert.match(productionEnvProblems({ ...staging, APP_ENV: undefined }).join(), /APP_ENV/)
  assert.match(productionEnvProblems({ ...staging, STRIPE_API_KEY: "sk_live_x" }).join(), /live interdite en staging/)
})

test("production : clé live, CJ hors sandbox, mentions et copie boutique exigées", () => {
  const prod = { ...staging, APP_ENV: "production" }
  const p = productionEnvProblems({ ...prod, CJ_SANDBOX: "1" })
  assert.equal(p.length, 4) // sk_test, CJ_SANDBOX, SHOP_LEGAL_LINE, SHOP_NOTIFY_EMAIL
  assert.deepEqual(productionEnvProblems({ ...prod, STRIPE_API_KEY: "sk_live_x", SHOP_LEGAL_LINE: "SNEAKR, SIRET …", SHOP_NOTIFY_EMAIL: "copie@exemple.fr" }), [])
})
