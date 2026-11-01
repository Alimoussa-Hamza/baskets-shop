import type { Product, Variant } from "./medusa"

export type Gender = "female" | "male"
export const GENRES: Record<string, { gender: Gender; label: string }> = {
  "baskets-femme": { gender: "female", label: "Baskets femme" },
  "baskets-homme": { gender: "male", label: "Baskets homme" },
}
export const genreSlug = (g?: unknown) => (g === "male" ? "baskets-homme" : "baskets-femme")

export const COLOR_HEX: Record<string, string> = {
  Noir: "#111111", Blanc: "#ffffff", Bleu: "#1f4fff", Gris: "#6b6b66", Beige: "#d9cdb8",
  Vert: "#2f6b4f", Rouge: "#c8332b", Rose: "#e7a3b5", Marron: "#7a4e2d", Crème: "#f1ead8",
}

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
  const colors = [...new Set(vs.map((v) => optionValue(v, "Couleur")).filter((x): x is string => !!x))]
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
