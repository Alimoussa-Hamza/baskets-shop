// Client minimal de l'API CJdropshipping (v2.0), d'après developers.cjdropshipping.com (consulté le 29/10/2026).
// Jeton : 180 jours, renvoyé à l'identique pendant 24 h ; limite 1 appel/seconde (QPS = 1).
// Commandes créées avec payType=3 (« création seule ») : AUCUN paiement automatique, la commande se valide
// et se paie dans l'espace CJ. Passer au paiement par solde (payType=2) seulement après des essais en sandbox.
const BASE = "https://developers.cjdropshipping.com/api2.0/v1"

type CjResponse<T> = { code: number; result: boolean; message: string; data: T | null; requestId?: string }

export class CjError extends Error {
  constructor(message: string, readonly code?: number, readonly requestId?: string) { super(message) }
}

let token: { value: string; expires: number } | null = null
let lastCall = 0

async function call<T>(path: string, body: unknown, auth = true): Promise<T> {
  const wait = lastCall + 1100 - Date.now() // QPS = 1
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) headers["CJ-Access-Token"] = await accessToken()
  const res = await fetch(`${BASE}${path}`, { method: "POST", headers, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000) })
  const json = (await res.json().catch(() => null)) as CjResponse<T> | null
  if (!res.ok || !json?.result || json.code !== 200) {
    throw new CjError(`CJ ${path} : ${json?.message ?? `HTTP ${res.status}`}`, json?.code, json?.requestId)
  }
  return json.data as T
}

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now()) return token.value
  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new CjError("CJ_API_KEY manquante : impossible de transmettre la commande à CJ")
  const data = await call<{ accessToken: string; accessTokenExpiryDate: string }>("/authentication/getAccessToken", { apiKey }, false)
  const expiry = Date.parse(data.accessTokenExpiryDate)
  // Marge d'un jour ; à défaut de date lisible, on redemande au bout de 24 h.
  token = { value: data.accessToken, expires: Number.isFinite(expiry) ? expiry - 86_400_000 : Date.now() + 86_400_000 }
  return token.value
}

export type CjOrderInput = {
  orderNumber: string; fromCountryCode: string; logisticName: string
  shipping: { name: string; address1: string; address2?: string | null; zip?: string | null; city: string; province?: string | null; countryCode: string; country: string; phone?: string | null; email?: string | null }
  products: { vid: string; quantity: number; storeLineItemId: string }[]
}

export async function createCjOrder(o: CjOrderInput): Promise<{ orderId: string | null; orderStatus: string | null }> {
  const s = o.shipping
  const data = await call<{ orderId?: string; orderStatus?: string }>("/shopping/order/createOrderV2", {
    orderNumber: o.orderNumber,
    shippingCountryCode: s.countryCode, shippingCountry: s.country,
    shippingProvince: s.province || s.city, // champ obligatoire chez CJ ; la France n'a pas de « province » d'adresse
    shippingCity: s.city, shippingZip: s.zip ?? "", shippingAddress: s.address1, shippingAddress2: s.address2 ?? "",
    shippingCustomerName: s.name, shippingPhone: s.phone ?? "", email: s.email ?? "",
    fromCountryCode: o.fromCountryCode, logisticName: o.logisticName,
    payType: 3, isSandbox: process.env.CJ_SANDBOX === "1" ? 1 : 0, platform: "Api",
    products: o.products,
  })
  // orderId peut être vide (cf. doc) : CJ le communique alors par webhook.
  return { orderId: data?.orderId || null, orderStatus: data?.orderStatus || null }
}
