// Conversion d'une fiche CJdropshipping en produit de la boutique (sans appel réseau : testable).
// Règles : pointure EU obligatoire, couleur traduite, stock de l'entrepôt du fournisseur seulement, prix de vente
// = coût × coefficient arrondi en …9 €, refus des noms de grandes marques (contrefaçon : délit, saisie en douane).
import type { CjProduct } from "./cj"

// Marques déposées fréquemment copiées sur les places de marché : un nom qui les cite = contrefaçon probable.
const BRANDS = [
  "nike", "air max", "air force", "jordan", "dunk", "yeezy", "adidas", "samba", "gazelle", "superstar", "stan smith",
  "new balance", "asics", "puma", "reebok", "vans", "converse", "chuck taylor", "salomon", "hoka", "on cloud",
  "balenciaga", "gucci", "louis vuitton", "dior", "prada", "alexander mcqueen", "golden goose", "veja", "lacoste",
  "fila", "skechers", "timberland", "dr martens", "travis scott", "off-white", "off white",
]

export function blockedBrand(text: string): string | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `
  return BRANDS.find((b) => t.includes(` ${b.replace(/[^a-z0-9]+/g, " ")} `)) ?? null
}

const COLORS: [RegExp, string][] = [
  [/off ?white|cream|beige white|ivory/, "Crème"], [/white/, "Blanc"], [/black/, "Noir"], [/gr[ae]y|silver/, "Gris"],
  [/navy|blue/, "Bleu"], [/red|burgundy|wine/, "Rouge"], [/pink/, "Rose"], [/green|olive/, "Vert"],
  [/brown|coffee|camel/, "Marron"], [/beige|khaki|apricot|sand/, "Beige"], [/yellow/, "Jaune"], [/orange/, "Orange"],
  [/purple|violet/, "Violet"],
]

export function frenchColor(raw: string): string {
  const t = raw.toLowerCase()
  const hit = COLORS.find(([re]) => re.test(t))
  if (hit) return hit[1]
  const clean = raw.trim().replace(/\s+/g, " ")
  return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase()
}

const SIZE = /^(?:eu\s?)?(3[4-9]|4[0-8])(?:[.,]5)?$/i

/** « Black-42 », « 42-White », « EU43 Grey » → { size: "42", color: "Noir" } ; null sans pointure EU lisible. */
export function parseVariantKey(key: string): { size: string; color: string } | null {
  const parts = key.split(/[-/_|;]+/).map((p) => p.trim()).filter(Boolean)
  const sizeAt = parts.findIndex((p) => SIZE.test(p))
  if (sizeAt < 0) return null
  const size = parts[sizeAt].replace(/^eu\s?/i, "").replace(",", ".")
  const rest = parts.filter((_, i) => i !== sizeAt).join(" ")
  return { size, color: rest ? frenchColor(rest) : "Unique" }
}

/** Prix TTC en euros : coût × coefficient, arrondi au …9 € supérieur (ex. 61,20 → 69). */
export function retailPrice(costEur: number, coef: number): number {
  return Math.ceil((costEur * coef + 1) / 10) * 10 - 1
}

const text = (html: string | null) =>
  (html ?? "").replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ").replace(/<br\s*\/?>|<\/p>|<\/li>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 4000)

export const slug = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60)

export type ImportOptions = { countryCode: string; usdToEur: number; coef: number }

export type ImportedVariant = { vid: string; size: string; color: string; stock: number; costCents: number; priceEur: number; image: string | null }

export type ImportPlan = {
  title: string; handle: string; description: string; images: string[]
  sizes: string[]; colors: string[]; variants: ImportedVariant[]; skipped: string[]
}

/** Plan d'import, ou une erreur expliquant le refus (marque, aucune variante vendable). */
export function planImport(p: CjProduct, o: ImportOptions): ImportPlan | { error: string } {
  const brand = blockedBrand(`${p.productNameEn} ${p.productSku}`)
  if (brand) return { error: `Nom citant la marque « ${brand} » : contrefaçon probable, import refusé` }
  const skipped: string[] = []
  const variants: ImportedVariant[] = []
  const seen = new Set<string>()
  for (const v of p.variants ?? []) {
    const label = v.variantKey || v.variantNameEn || v.variantSku
    const parsed = parseVariantKey(v.variantKey ?? "") ?? parseVariantKey(v.variantNameEn ?? "")
    if (!parsed) { skipped.push(`${label} : pointure EU illisible`); continue }
    const stock = (v.inventories ?? []).filter((i) => i.countryCode?.toUpperCase() === o.countryCode.toUpperCase()).reduce((s, i) => s + (Number(i.totalInventory) || 0), 0)
    if (stock <= 0) { skipped.push(`${label} : pas de stock en ${o.countryCode.toUpperCase()}`); continue }
    const id = `${parsed.size}/${parsed.color}`
    if (seen.has(id)) { skipped.push(`${label} : doublon de ${id}`); continue }
    seen.add(id)
    const costEur = Number(v.variantSellPrice) * o.usdToEur
    if (!(costEur > 0)) { skipped.push(`${label} : prix d'achat absent`); continue }
    variants.push({ vid: v.vid, ...parsed, stock, costCents: Math.round(costEur * 100), priceEur: retailPrice(costEur, o.coef), image: v.variantImage })
  }
  if (!variants.length) return { error: `Aucune variante vendable (${skipped.length} écartées : ${skipped.slice(0, 3).join(" ; ")})` }
  const set = Array.isArray(p.productImageSet) ? p.productImageSet : (() => { try { return JSON.parse(p.productImageSet ?? "[]") as string[] } catch { return [] } })()
  const images = [...new Set([p.bigImage, ...set, ...variants.map((v) => v.image)].filter((u): u is string => typeof u === "string" && /^https:\/\//.test(u)))].slice(0, 8)
  const bySize = (a: string, b: string) => Number(a) - Number(b)
  return {
    title: p.productNameEn.trim().slice(0, 120), handle: slug(p.productNameEn), description: text(p.description), images,
    sizes: [...new Set(variants.map((v) => v.size))].sort(bySize), colors: [...new Set(variants.map((v) => v.color))],
    variants, skipped,
  }
}
