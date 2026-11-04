// Conversion d'une fiche CJdropshipping en produit de la boutique (sans appel réseau : testable).
// Règles : pointure EU obligatoire, couleur traduite, stock de l'entrepôt du fournisseur seulement, prix de vente
// = coût de revient (achat + port + douane) × coefficient arrondi en …9 €, refus des noms de grandes marques (contrefaçon : délit, saisie en douane).
import type { CjProduct } from "./cj"

// Marques déposées fréquemment copiées sur les places de marché : un nom qui les cite = contrefaçon probable.
const BRANDS = [
  "nike", "air max", "air force", "jordan", "dunk", "yeezy", "adidas", "samba", "gazelle", "superstar", "stan smith",
  "new balance", "asics", "puma", "reebok", "vans", "converse", "chuck taylor", "salomon", "hoka", "on cloud",
  "balenciaga", "gucci", "louis vuitton", "dior", "prada", "alexander mcqueen", "golden goose", "veja", "lacoste",
  "fila", "skechers", "timberland", "dr martens", "travis scott", "off-white", "off white",
]

// Catégories CJ de baskets (GET /product/getCategory, 02/11/2026). « Vulcanize Shoes » = baskets en toile/semelle vulcanisée.
export const CJ_SNEAKER_CATEGORIES = [
  { key: "femme", label: "Baskets femme", id: "1B559D30-B370-4C8E-8CFD-1E1BC47E217F" },
  { key: "homme", label: "Baskets homme", id: "B8640E7B-F07D-4C0F-A5CF-8ACC533DA86F" },
  { key: "homme-casual", label: "Chaussures casual homme", id: "F419006D-AE55-4691-93FC-52FEBB459DBA" },
  { key: "running", label: "Running", id: "24A29AC9-8B9B-4552-AF5E-431E6CF47C67" },
  { key: "basket", label: "Basketball", id: "C8FD79F7-DF24-495F-BE12-5F8585A8E5ED" },
] as const

export function blockedBrand(text: string): string | null {
  const t = ` ${text.toLowerCase().replace(/[^a-z0-9]+/g, " ")} `
  return BRANDS.find((b) => t.includes(` ${b.replace(/[^a-z0-9]+/g, " ")} `)) ?? null
}

const COLORS: [RegExp, string][] = [
  [/off ?white|cream|beige white|ivory/, "Crème"], [/white/, "Blanc"], [/black/, "Noir"], [/gr[ae]y|silver/, "Gris"],
  [/navy|blue/, "Bleu"], [/red|burgundy|wine/, "Rouge"], [/pink/, "Rose"], [/green|olive|chartreuse|lime/, "Vert"],
  [/brown|coffee|camel/, "Marron"], [/beige|khaki|apricot|sand/, "Beige"], [/yellow/, "Jaune"], [/orange/, "Orange"],
  [/purple|violet/, "Violet"],
]

// Matière, ajoutée au nom quand deux variantes auraient sinon la même couleur (« Noir/Blanc aspect cuir » / « Noir/Blanc mesh »).
// « Leather » chez CJ = le plus souvent du PU synthétique : jamais « cuir » (étiquetage des chaussures, pratique trompeuse).
const MATERIALS: [RegExp, string][] = [[/leather/, "aspect cuir"], [/mesh|knit|fly ?woven/, "mesh"], [/canvas/, "toile"], [/suede/, "daim"], [/velvet|fleece|plush/, "fourrée"]]

// Réhausse annoncée par le fabricant (« Height Increased By 8 », « increased by 6cm ») : toujours dans le nom du coloris,
// c'est ce que le client choisit. À vérifier sur échantillon avant de l'afficher comme argument.
const LIFT = /(?:height\s+)?increas(?:ed|ing|e)\s*(?:by\s*)?(\d{1,2})\s*(?:cm)?/i

/** « Black White » → « Noir/Blanc » (toutes les couleurs, dans l'ordre) ; inconnue → libellé d'origine. */
export function frenchColor(raw: string, withMaterial = false): string {
  let t = raw.toLowerCase()
  const found: string[] = []
  for (const [re, fr] of COLORS) {
    const g = new RegExp(re.source, "g")
    if (g.test(t)) { if (!found.includes(fr)) found.push(fr); t = t.replace(g, " ") }
  }
  if (!found.length && /^\s*(multi|colou?r|mixed)/.test(t)) return "Multicolore" // « Color », « Multicolor » : libellés CJ sans couleur précise
  if (!found.length) { const clean = raw.trim().replace(/\s+/g, " "); return clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() }
  const order = found.map((f) => raw.toLowerCase().search(new RegExp(COLORS.find(([, x]) => x === f)![0].source)))
  const name = found.map((f, i) => [f, order[i]] as const).sort((a, b) => a[1] - b[1]).map(([f]) => f).join("/")
  const material = withMaterial ? MATERIALS.find(([re]) => re.test(raw.toLowerCase()))?.[1] : undefined
  return material ? `${name} ${material}` : name
}

const SIZE = /^(?:eur?|size|taille)?\s?(3[4-9]|4[0-8])(?:[.,]5)?$/i

/** « Black-42 », « 42-White », « EU43 Grey », « Mesh White-Size39 » → { size, color } ; null sans pointure EU lisible. */
export function parseVariantKey(key: string, withMaterial = false): { size: string; color: string } | null {
  const parts = key.split(/[-/_|;]+/).map((p) => p.trim().replace(/\.$/, "")).filter(Boolean) // « Black-39. » : point final chez CJ
  const sizeAt = parts.findIndex((p) => SIZE.test(p))
  if (sizeAt < 0) return null
  const size = parts[sizeAt].replace(/^(?:eur?|size|taille)\s?/i, "").replace(",", ".")
  let rest = parts.filter((_, i) => i !== sizeAt).join(" ")
  const lift = rest.match(LIFT)?.[1]
  if (lift) rest = rest.replace(LIFT, " ").trim()
  const color = rest ? frenchColor(rest, withMaterial) : "Unique"
  return { size, color: lift ? `${color} +${lift} cm` : color }
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

// shippingEur : port CJ par paire ; dutyEur : droit de douane forfaitaire UE (3 € par article depuis le 01/07/2026, hors UE)
export type ImportOptions = { countryCode: string; usdToEur: number; coef: number; shippingEur: number; dutyEur: number }

// costCents = prix d'achat seul ; landedCents = coût de revient (achat + port + douane), base de la marge
export type ImportedVariant = { vid: string; size: string; color: string; stock: number; costCents: number; landedCents: number; priceEur: number; image: string | null }

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
  // La matière n'entre dans le nom de couleur que si elle évite des doublons (« Noir/Blanc cuir » et « Noir/Blanc mesh »)
  const keyOf = (v: CjProduct["variants"][number], m: boolean) => { const x = parseVariantKey(v.variantKey ?? "", m) ?? parseVariantKey(v.variantNameEn ?? "", m); return x ? `${x.size}/${x.color}` : null }
  const plain = (p.variants ?? []).map((v) => keyOf(v, false)).filter(Boolean)
  const withMaterial = new Set(plain).size < plain.length
  for (const v of p.variants ?? []) {
    const label = v.variantKey || v.variantNameEn || v.variantSku
    const parsed = parseVariantKey(v.variantKey ?? "", withMaterial) ?? parseVariantKey(v.variantNameEn ?? "", withMaterial)
    if (!parsed) { skipped.push(`${label} : pointure EU illisible`); continue }
    const stock = (v.inventories ?? []).filter((i) => i.countryCode?.toUpperCase() === o.countryCode.toUpperCase()).reduce((s, i) => s + (Number(i.totalInventory) || 0), 0)
    if (stock <= 0) { skipped.push(`${label} : pas de stock en ${o.countryCode.toUpperCase()}`); continue }
    const id = `${parsed.size}/${parsed.color}`
    if (seen.has(id)) { skipped.push(`${label} : doublon de ${id}`); continue }
    seen.add(id)
    const costEur = Number(v.variantSellPrice) * o.usdToEur
    if (!(costEur > 0)) { skipped.push(`${label} : prix d'achat absent`); continue }
    const landed = costEur + o.shippingEur + o.dutyEur
    variants.push({ vid: v.vid, ...parsed, stock, costCents: Math.round(costEur * 100), landedCents: Math.round(landed * 100), priceEur: retailPrice(landed, o.coef), image: v.variantImage })
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
