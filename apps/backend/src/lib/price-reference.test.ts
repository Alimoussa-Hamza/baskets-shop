import test from "node:test"
import assert from "node:assert/strict"
import { lowestIn30Days, recordPrice } from "./price-reference.ts"

const d = (s: string) => new Date(`${s}T12:00:00Z`)

test("garde le prix le plus bas des 30 derniers jours", () => {
  let h = recordPrice(null, d("2026-10-01"), 119)
  h = recordPrice(h, d("2026-10-15"), 99) // promo passée
  h = recordPrice(h, d("2026-11-10"), 139) // hausse juste avant le Black Friday
  // Au 20/11 : le 99 du 15/10 est sorti de la fenêtre, le 119 du 01/10 aussi → référence = 139
  assert.equal(lowestIn30Days(h, d("2026-11-10")), 99)
  assert.equal(lowestIn30Days(h, d("2026-11-20")), 139)
})

test("une hausse récente ne peut pas gonfler le prix barré", () => {
  let h = recordPrice(null, d("2026-11-01"), 99)
  h = recordPrice(h, d("2026-11-20"), 149)
  assert.equal(lowestIn30Days(h, d("2026-11-27")), 99) // barré à 99, pas à 149
})

test("sans historique : aucun prix de référence (pas de prix barré)", () => {
  assert.equal(lowestIn30Days(null, d("2026-11-27")), null)
  assert.equal(lowestIn30Days([], d("2026-11-27")), null)
})

test("un relevé par jour, 31 jours conservés au plus", () => {
  let h = recordPrice(null, d("2026-10-01"), 100)
  h = recordPrice(h, d("2026-10-01"), 90) // même jour : remplacé
  assert.deepEqual(h, [["2026-10-01", 90]])
  for (let i = 2; i <= 31; i++) h = recordPrice(h, d(`2026-10-${String(i).padStart(2, "0")}`), 100)
  h = recordPrice(h, d("2026-11-15"), 100)
  assert.ok(h.every(([day]) => day >= "2026-10-16"))
})
