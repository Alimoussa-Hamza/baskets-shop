import test from "node:test"
import assert from "node:assert/strict"
import { blockedBrand, parseVariantKey, planImport, retailPrice } from "./cj-catalog.ts"
import type { CjProduct } from "./cj.ts"

test("lit la pointure EU et traduit la couleur", () => {
  assert.deepEqual(parseVariantKey("Black-42"), { size: "42", color: "Noir" })
  assert.deepEqual(parseVariantKey("42-Off White"), { size: "42", color: "Crème" })
  assert.deepEqual(parseVariantKey("EU43 / Navy Blue"), { size: "43", color: "Bleu" })
  assert.deepEqual(parseVariantKey("Lake Green-38.5"), { size: "38.5", color: "Vert" })
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
  ]), { countryCode: "de", usdToEur: 0.9, coef: 2.5 })
  assert.ok(!("error" in plan))
  assert.deepEqual(plan.variants.map((x) => [x.vid, x.size, x.color, x.stock, x.costCents, x.priceEur]), [["v1", "40", "Blanc", 12, 1800, 49], ["v3", "41", "Noir", 3, 1800, 49]])
  assert.deepEqual(plan.sizes, ["40", "41"])
  assert.equal(plan.skipped.length, 3)
  assert.equal(plan.description, "Light sole")
  assert.deepEqual(plan.images, ["https://img.example/a.jpg", "https://img.example/b.jpg"])
  assert.equal(plan.handle, "casual-breathable-sneakers")
})

test("plan d'import refusé : marque ou rien de vendable", () => {
  assert.match((planImport(product([v("v1", "White-40", { DE: 5 })], "Jordan 1 retro"), { countryCode: "DE", usdToEur: 0.9, coef: 2.5 }) as { error: string }).error, /jordan/)
  assert.match((planImport(product([v("v1", "White-40", { CN: 5 })]), { countryCode: "DE", usdToEur: 0.9, coef: 2.5 }) as { error: string }).error, /Aucune variante/)
})
