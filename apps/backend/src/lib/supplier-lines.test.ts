import test from "node:test"
import assert from "node:assert/strict"
import { costTotalCents, groupLinesBySupplier } from "./supplier-lines.ts"

test("répartit les lignes par fournisseur, variante prioritaire sur le produit", () => {
  const { bySupplier, unassigned } = groupLinesBySupplier([
    { id: "l1", title: "A", quantity: 2, variant: { sku: "A-40", metadata: { supplier_id: "sup_cj", supplier_sku: "vid-1", supplier_cost_cents: 3800 } } },
    { id: "l2", title: "B", quantity: "1", variant: { sku: "B-41", metadata: {} }, product: { metadata: { supplier_id: "sup_cj" } } },
    { id: "l3", title: "C", quantity: 1, variant: { metadata: { supplier_id: "sup_mail", supplier_cost_cents: "2500" } } },
    { id: "l4", title: "D", quantity: 1, variant: { metadata: {} } },
  ])
  assert.deepEqual([...bySupplier.keys()], ["sup_cj", "sup_mail"])
  assert.deepEqual(bySupplier.get("sup_cj")!.map((l) => [l.line_item_id, l.sku, l.quantity, l.unit_cost_cents]), [["l1", "vid-1", 2, 3800], ["l2", "B-41", 1, null]])
  assert.equal(bySupplier.get("sup_mail")![0].unit_cost_cents, 2500)
  assert.deepEqual(unassigned.map((l) => l.id), ["l4"])
})

test("coût total : null dès qu'un prix d'achat manque", () => {
  const line = (q: number, c: number | null) => ({ line_item_id: "x", title: "x", variant: null, sku: null, quantity: q, unit_cost_cents: c })
  assert.equal(costTotalCents([line(2, 3800), line(1, 2500)]), 10100)
  assert.equal(costTotalCents([line(2, 3800), line(1, null)]), null)
})
