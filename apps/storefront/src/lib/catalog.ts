import type { Product, Variant } from "./medusa"

export type Gender = "female" | "male"
export const GENRES: Record<string, { gender: Gender; label: string }> = {
  // Niche unique : baskets réhaussantes pour homme. Les anciens rayons femme/homme sont en brouillon dans l'admin.
  "baskets-rehaussantes": { gender: "male", label: "Baskets réhaussantes" },
}
export const genreSlug = (g?: unknown) => Object.keys(GENRES).find((k) => GENRES[k].gender === g) ?? Object.keys(GENRES)[0]

export const COLOR_HEX: Record<string, string> = {
  Noir: "#111111", Blanc: "#ffffff", Bleu: "#1f4fff", Gris: "#6b6b66", Beige: "#d9cdb8",
  Vert: "#2f6b4f", Rouge: "#c8332b", Rose: "#e7a3b5", Marron: "#7a4e2d", Crème: "#f1ead8",
  Jaune: "#f2c230", Orange: "#ee7a2f", Violet: "#6f4bb8",
}

/** Pastille de couleur : « Noir/Blanc cuir » → moitié noire, moitié blanche ; inconnue → gris. */
export function swatch(name: string): string {
  if (name.startsWith("Multicolore")) return "conic-gradient(#c8332b, #f2c230, #2f6b4f, #1f4fff, #6f4bb8, #c8332b)"
  const hexes = name.split(" ")[0].split("/").map((c) => COLOR_HEX[c]).filter(Boolean)
  if (hexes.length >= 2) return `linear-gradient(135deg, ${hexes[0]} 50%, ${hexes[1]} 50%)`
  return hexes[0] ?? "#cccccc"
}
/** « Marron fourrée +8 cm » → { base: "Marron", finish: "fourrée", lift: "8" }. Chez le fournisseur, version (matière,
 * doublure) et réhausse annoncée font partie du coloris : la fiche produit les propose comme des choix séparés,
 * les listes et filtres ne montrent que la couleur. */
const FINISH = / (fourrée|aspect cuir|mesh|toile|daim)$/
export function colorParts(name: string): { base: string; finish: string | null; lift: string | null } {
  const m = name.match(/^(.*) \+(\d+) cm$/)
  const rest = m ? m[1] : name
  const f = rest.match(FINISH)
  return { base: f ? rest.slice(0, f.index) : rest, finish: f ? f[1] : null, lift: m ? m[2] : null }
}
export const joinColor = (p: { base: string; finish: string | null; lift: string | null }) =>
  `${p.base}${p.finish ? ` ${p.finish}` : ""}${p.lift ? ` +${p.lift} cm` : ""}`
/** Couleur principale (pour l'illustration produit). */
export const mainHex = (name?: string | null) => (name ? COLOR_HEX[name.split(/[ /]/)[0]] : undefined)

// Délai de livraison annoncé (obligation d'information, art. L221-5) : métadonnée produit delivery_days
// (ex. « 8 à 15 » pour un envoi depuis la Chine), sinon le délai d'un stock en France ou dans l'UE.
export const DEFAULT_DELIVERY = "2 à 4"
export const deliveryDays = (meta?: Record<string, unknown> | null) =>
  typeof meta?.delivery_days === "string" && meta.delivery_days.trim() ? meta.delivery_days.trim() : DEFAULT_DELIVERY
const maxDays = (s: string) => Math.max(0, ...(s.match(/\d+/g) ?? []).map(Number))
/** Délai d'un panier : celui de l'article le plus long à livrer. */
export const longestDelivery = (metas: (Record<string, unknown> | null | undefined)[]) =>
  metas.map(deliveryDays).reduce((a, b) => (maxDays(b) > maxDays(a) ? b : a), DEFAULT_DELIVERY)

export const eur = (n: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n)

export function productPath(p: Product): string {
  const cat = p.categories?.[0]?.handle ?? "baskets"
  return `/${genreSlug(p.metadata?.gender)}/${cat}/${p.handle}`
}

export function optionValue(v: Variant, title: string): string | undefined {
  return v.options?.find((o) => o.option?.title === title)?.value
}

/** Prix barré d'une variante : seulement si une liste de prix soldés s'applique ET que le prix est sous le plus bas
 * des 30 derniers jours (art. L112-1-1 Code conso, relevé par le backend). Sinon null : aucun prix barré. */
export function compareAt(v: Variant): number | null {
  const cp = v.calculated_price
  const ref = Number(v.metadata?.price_ref_30d)
  if (!cp?.is_calculated_price_price_list || !Number.isFinite(ref) || ref <= 0) return null
  return cp.calculated_amount < ref ? ref : null
}
export const discountPct = (price: number, ref: number | null) => (ref ? Math.round((1 - price / ref) * 100) : 0)

export function minPrice(p: Product): number {
  const prices = (p.variants ?? []).map((v) => v.calculated_price?.calculated_amount).filter((x): x is number => typeof x === "number")
  return prices.length ? Math.min(...prices) : 0
}

/** Carte produit allégée, passée aux composants client (évite d'envoyer tout l'objet Medusa). */
export type Card = {
  id: string; handle: string; title: string; subtitle: string; href: string
  price: number; compareAt: number | null; colors: string[]; sizesInStock: string[]; category: string; image: string | null
  inStock: boolean; lowStock: boolean
}

export function toCard(p: Product): Card {
  const vs = p.variants ?? []
  const colors = [...new Set(vs.map((v) => optionValue(v, "Couleur")).filter((x): x is string => !!x).map((c) => colorParts(c).base))]
  const inStock = vs.filter((v) => (v.inventory_quantity ?? 0) > 0)
  const sizes = [...new Set(inStock.map((v) => optionValue(v, "Taille")).filter((x): x is string => !!x))]
  const price = minPrice(p)
  // Prix barré de la variante la moins chère (celle dont le prix est affiché)
  const cheapest = vs.find((v) => v.calculated_price?.calculated_amount === price)
  return {
    id: p.id, handle: p.handle, title: p.title, subtitle: p.subtitle ?? "", href: productPath(p),
    price, compareAt: cheapest ? compareAt(cheapest) : null, colors, sizesInStock: sizes, category: p.categories?.[0]?.handle ?? "",
    image: p.thumbnail ?? p.images?.[0]?.url ?? null,
    inStock: inStock.length > 0,
    lowStock: inStock.length > 0 && inStock.every((v) => (v.inventory_quantity ?? 0) <= 3),
  }
}
