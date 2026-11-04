import test from "node:test"
import assert from "node:assert/strict"
import { blockedBrand, parseVariantKey, planImport, retailPrice } from "./cj-catalog.ts"
import type { CjProduct } from "./cj.ts"

test("lit la pointure EU et traduit la couleur", () => {
  assert.deepEqual(parseVariantKey("Black-42"), { size: "42", color: "Noir" })
  assert.deepEqual(parseVariantKey("42-Off White"), { size: "42", color: "Crème" })
  assert.deepEqual(parseVariantKey("EU43 / Navy Blue"), { size: "43", color: "Bleu" })
  assert.deepEqual(parseVariantKey("Lake Green-38.5"), { size: "38.5", color: "Vert" })
  assert.deepEqual(parseVariantKey("Mesh White Grey-Size39"), { size: "39", color: "Blanc/Gris" })
  assert.deepEqual(parseVariantKey("Black Blue-39."), { size: "39", color: "Noir/Bleu" })
  assert.deepEqual(parseVariantKey("White Height Increased By 8-37"), { size: "37", color: "Blanc +8 cm" })
  assert.deepEqual(parseVariantKey("Black increased by 6cm-42"), { size: "42", color: "Noir +6 cm" })
  assert.deepEqual(parseVariantKey("White Height Increasing 6-40"), { size: "40", color: "Blanc +6 cm" })
  assert.deepEqual(parseVariantKey("Black increase10cm-41"), { size: "41", color: "Noir +10 cm" })
  assert.deepEqual(parseVariantKey("Brown With Velvet-40", true), { size: "40", color: "Marron fourrée" })
  assert.deepEqual(parseVariantKey("Leather Black White-Size40", true), { size: "40", color: "Noir/Blanc aspect cuir" })
  assert.deepEqual(parseVariantKey("EUR 44-Red"), { size: "44", color: "Rouge" })
  assert.deepEqual(parseVariantKey("Vivid chartreuse-38"), { size: "38", color: "Vert" })
  assert.deepEqual(parseVariantKey("Color-41"), { size: "41", color: "Multicolore" })
  assert.equal(parseVariantKey("Black-XL"), null) // pas une pointure
  assert.equal(parseVariantKey("US 9-Black"), null) // pointure US : non convertie, écartée
})

test("refuse les noms de grandes marques", () => {
  assert.equal(blockedBrand("Men's AIR-MAX style running shoes"), "air max")
  assert.equal(blockedBrand("Retro Samba-like low sneakers"), "samba")
  assert.equal(blockedBrand("Women's breathable white sneakers"), null)
  assert.equal(blockedBrand("Pumpkin color canvas shoes"), null) // « puma » seulement en mot entier
})

test("prix de vente arrondi en …9 €", () => {
  assert.equal(retailPrice(24.48, 2.5), 69) // 61,20 → 69
  assert.equal(retailPrice(31.6, 2.5), 79) // 79,00 pile → 79
  assert.equal(retailPrice(40, 2.5), 109) // 100 → 109
})

const product = (variants: CjProduct["variants"], name = "Casual Breathable Sneakers"): CjProduct => ({
  pid: "p1", productNameEn: name, productSku: "CJ1", bigImage: "https://img.example/a.jpg",
  productImageSet: '["https://img.example/a.jpg","https://img.example/b.jpg"]', description: "<p>Light&nbsp;sole</p><script>x()</script>", variants,
})
const v = (vid: string, key: string, stock: Record<string, number>, price = 20) => ({
  vid, variantSku: vid, variantKey: key, variantNameEn: null, variantImage: null, variantSellPrice: price,
  inventories: Object.entries(stock).map(([countryCode, totalInventory]) => ({ countryCode, totalInventory })),
})

test("plan d'import : stock de l'entrepôt choisi seulement, variantes illisibles écartées", () => {
  const plan = planImport(product([
    v("v1", "White-40", { DE: 12, CN: 900 }), v("v2", "White-41", { CN: 500 }), v("v3", "Black-41", { DE: 3 }),
    v("v4", "White-XL", { DE: 5 }), v("v5", "White-40", { DE: 1 }),
  ]), { countryCode: "de", usdToEur: 0.9, coef: 2, shippingEur: 10, dutyEur: 3 })
  assert.ok(!("error" in plan))
  assert.deepEqual(plan.variants.map((x) => [x.vid, x.size, x.color, x.stock, x.costCents, x.landedCents, x.priceEur]), [["v1", "40", "Blanc", 12, 1800, 3100, 69], ["v3", "41", "Noir", 3, 1800, 3100, 69]])
  assert.deepEqual(plan.sizes, ["40", "41"])
  assert.equal(plan.skipped.length, 3)
  assert.equal(plan.description, "Light sole")
  assert.deepEqual(plan.images, ["https://img.example/a.jpg", "https://img.example/b.jpg"])
  assert.equal(plan.handle, "casual-breathable-sneakers")
})

test("plan d'import : la matière départage deux coloris identiques", () => {
  const plan = planImport(product([v("a", "Mesh Black White-Size40", { CN: 5 }), v("b", "Leather Black White-Size40", { CN: 5 }), v("c", "Leather White Grey-Size40", { CN: 5 })]),
    { countryCode: "CN", usdToEur: 0.9, coef: 2, shippingEur: 10, dutyEur: 3 })
  assert.ok(!("error" in plan))
  assert.deepEqual(plan.colors, ["Noir/Blanc mesh", "Noir/Blanc aspect cuir", "Blanc/Gris aspect cuir"])
  assert.equal(plan.skipped.length, 0)
})

test("plan d'import refusé : marque ou rien de vendable", () => {
  assert.match((planImport(product([v("v1", "White-40", { DE: 5 })], "Jordan 1 retro"), { countryCode: "DE", usdToEur: 0.9, coef: 2, shippingEur: 10, dutyEur: 3 }) as { error: string }).error, /jordan/)
  assert.match((planImport(product([v("v1", "White-40", { CN: 5 })]), { countryCode: "DE", usdToEur: 0.9, coef: 2, shippingEur: 10, dutyEur: 3 }) as { error: string }).error, /Aucune variante/)
})
