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

async function call<T>(path: string, body: unknown, auth = true, method: "GET" | "POST" = "POST"): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (auth) headers["CJ-Access-Token"] = await accessToken() // avant l'attente : le jeton compte aussi pour QPS = 1
  const wait = lastCall + 1100 - Date.now() // QPS = 1
  if (wait > 0) await new Promise((r) => setTimeout(r, wait))
  lastCall = Date.now()
  const url = method === "GET" ? `${BASE}${path}?${new URLSearchParams(body as Record<string, string>)}` : `${BASE}${path}`
  const res = await fetch(url, { method, headers, body: method === "POST" ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) })
  const json = (await res.json().catch(() => null)) as CjResponse<T> | null
  // code 200 = succès ; « result » manque sur certaines réponses réussies (getInventoryByPid, constaté le 02/11/2026)
  if (!res.ok || json?.code !== 200) {
    throw new CjError(`CJ ${path} : ${json?.message ?? `HTTP ${res.status}`}`, json?.code, json?.requestId)
  }
  return json.data as T
}

async function accessToken(): Promise<string> {
  if (token && token.expires > Date.now()) return token.value
  const apiKey = process.env.CJ_API_KEY
  if (!apiKey) throw new CjError("CJ_API_KEY manquante : renseignez la clé API CJ dans le .env du backend")
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

// TVA à l'import (envoi hors UE vers l'UE, ≤ 150 €) : CJ exige une option IOSS. CJ_IOSS_TYPE : 2 = votre propre
// numéro IOSS (CJ_IOSS_NUMBER), 3 = IOSS de CJ (par défaut). Choix à valider avec le comptable. Sans objet depuis l'UE.
const EU = new Set(["AT", "BE", "BG", "CY", "CZ", "DE", "DK", "EE", "ES", "FI", "FR", "GR", "HR", "HU", "IE", "IT", "LT", "LU", "LV", "MT", "NL", "PL", "PT", "RO", "SE", "SI", "SK"])
function ioss(fromCountryCode: string) {
  if (EU.has(fromCountryCode.toUpperCase())) return {}
  if (process.env.CJ_IOSS_TYPE === "2") return { iossType: 2, iossNumber: process.env.CJ_IOSS_NUMBER ?? "" }
  return { iossType: 3, iossNumber: "CJ-IOSS" }
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
    ...ioss(o.fromCountryCode),
    products: o.products,
  })
  // orderId peut être vide (cf. doc) : CJ le communique alors par webhook.
  return { orderId: data?.orderId || null, orderStatus: data?.orderStatus || null }
}

// --- Catalogue (doc consultée le 02/11/2026). Recherche via GET /product/list : son filtre countryCode marche ;
// celui de /product/listV2 (pourtant « recommandé ») renvoie 0 résultat pour tous les pays (constaté le 02/11/2026).

export type CjSearchHit = { pid: string; productNameEn: string; productImage: string; sellPrice: string | number; listedNum?: number }

/** Recherche par catégorie CJ et/ou nom (en anglais) dans le stock de l'entrepôt du pays donné (ex. DE, CN). */
// Tri par nombre de boutiques qui vendent déjà le produit (listedNum) : un premier indice de qualité.
export async function searchCjProducts(q: { keyWord?: string; categoryId?: string; countryCode: string; page?: number; size?: number }) {
  const data = await call<{ total: number; list: CjSearchHit[] }>("/product/list", {
    ...(q.keyWord ? { productNameEn: q.keyWord } : {}), ...(q.categoryId ? { categoryId: q.categoryId } : {}),
    countryCode: q.countryCode, orderBy: "listedNum", sort: "desc", pageNum: String(q.page ?? 1), pageSize: String(q.size ?? 40),
  }, true, "GET")
  return { total: data?.total ?? 0, products: data?.list ?? [] }
}

export type CjVariant = {
  vid: string; variantSku: string; variantKey: string | null; variantNameEn: string | null; variantImage: string | null
  variantSellPrice: number | string; inventories?: { countryCode: string; totalInventory: number }[]
}
export type CjProduct = {
  pid: string; productNameEn: string; productSku: string; bigImage: string; productImageSet: string[] | string | null
  description: string | null; variants: CjVariant[]
}

/** Fiche produit avec le stock de chaque variante. /product/query ne renvoie pas le stock (inventories = null,
 *  constaté le 02/11/2026) : il vient de /product/stock/getInventoryByPid. Stock « usine » compris. */
export async function getCjProduct(pid: string): Promise<CjProduct> {
  const product = await call<CjProduct>("/product/query", { pid }, true, "GET")
  const inv = await call<{ variantInventories?: { vid: string; inventory: { countryCode: string; totalInventory: number }[] }[] }>(
    "/product/stock/getInventoryByPid", { pid }, true, "GET")
  const byVid = new Map((inv?.variantInventories ?? []).map((v) => [v.vid, v.inventory ?? []]))
  return { ...product, variants: (product.variants ?? []).map((v) => ({ ...v, inventories: byVid.get(v.vid) ?? [] })) }
}

/** Stock d'une variante dans l'entrepôt d'un pays (GET /product/stock/queryByVid). */
export async function cjStock(vid: string, countryCode: string): Promise<number> {
  const rows = await call<{ countryCode: string; totalInventoryNum: number }[]>("/product/stock/queryByVid", { vid }, true, "GET")
  return (rows ?? []).filter((r) => r.countryCode?.toUpperCase() === countryCode.toUpperCase()).reduce((s, r) => s + (Number(r.totalInventoryNum) || 0), 0)
}

/** Frais de port CJ pour 1 unité d'une variante (USD) et délai de transport en jours (« 4-10 »), par transporteur. */
export async function cjFreight(vid: string, fromCountry: string, toCountry: string) {
  const rows = await call<{ logisticName: string; logisticPrice: number; logisticAging: string }[]>("/logistic/freightCalculate", {
    startCountryCode: fromCountry.toUpperCase(), endCountryCode: toCountry.toUpperCase(), products: [{ quantity: 1, vid }],
  })
  return rows ?? []
}
