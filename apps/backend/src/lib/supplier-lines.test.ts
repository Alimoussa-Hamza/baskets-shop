import test from "node:test"
import assert from "node:assert/strict"
import { costTotalCents, groupLinesBySupplier } from "./supplier-lines.ts"

test("répartit les lignes par fournisseur selon la table supplier_variant", () => {
  const sourcing = new Map([
    ["v1", { supplier_id: "sup_cj", sku: "vid-1", cost_cents: 3800 }],
    ["v2", { supplier_id: "sup_cj", sku: null, cost_cents: null }],
    ["v3", { supplier_id: "sup_mail", sku: "", cost_cents: 2500 }],
  ])
  const { bySupplier, unassigned } = groupLinesBySupplier([
    { id: "l1", title: "A", quantity: 2, variant_id: "v1", variant: { sku: "A-40" } },
    { id: "l2", title: "B", quantity: "1", variant_id: "v2", variant: { sku: "B-41" } }, // sans réf. fournisseur : SKU de la boutique
    { id: "l3", title: "C", quantity: 1, variant_id: "v3" },
    { id: "l4", title: "D", quantity: 1, variant_id: "v4" }, // variante sans fournisseur
    { id: "l5", title: "E", quantity: 1, variant_id: null }, // variante supprimée depuis
  ], sourcing)
  assert.deepEqual([...bySupplier.keys()], ["sup_cj", "sup_mail"])
  assert.deepEqual(bySupplier.get("sup_cj")!.map((l) => [l.line_item_id, l.sku, l.quantity, l.unit_cost_cents]), [["l1", "vid-1", 2, 3800], ["l2", "B-41", 1, null]])
  assert.deepEqual(bySupplier.get("sup_mail")!.map((l) => [l.sku, l.unit_cost_cents]), [[null, 2500]])
  assert.deepEqual(unassigned.map((l) => l.id), ["l4", "l5"])
})

test("coût total : null dès qu'un prix d'achat manque", () => {
  const line = (q: number, c: number | null) => ({ line_item_id: "x", title: "x", variant: null, sku: null, quantity: q, unit_cost_cents: c })
  assert.equal(costTotalCents([line(2, 3800), line(1, 2500)]), 10100)
  assert.equal(costTotalCents([line(2, 3800), line(1, null)]), null)
})
