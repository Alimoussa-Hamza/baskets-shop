// Répartition des lignes d'une commande par fournisseur (dropshipping).
// Lien produit → fournisseur dans les métadonnées de la variante (sinon du produit) :
//   supplier_id          id du fournisseur (sup_…)
//   supplier_sku         référence chez le fournisseur (pour CJ : l'id de variante « vid »)
//   supplier_cost_cents  prix d'achat unitaire HT, en centimes (sert au calcul de marge)

export type OrderLine = {
  id: string; title: string; variant_title?: string | null; quantity: number | string
  variant?: { sku?: string | null; metadata?: Record<string, unknown> | null } | null
  product?: { metadata?: Record<string, unknown> | null } | null
}

export type SupplierLine = {
  line_item_id: string; title: string; variant: string | null; sku: string | null; quantity: number; unit_cost_cents: number | null
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

export function groupLinesBySupplier(items: OrderLine[]): { bySupplier: Map<string, SupplierLine[]>; unassigned: OrderLine[] } {
  const bySupplier = new Map<string, SupplierLine[]>()
  const unassigned: OrderLine[] = []
  for (const it of items) {
    const vm = it.variant?.metadata ?? {}
    const supplierId = str(vm.supplier_id) ?? str(it.product?.metadata?.supplier_id)
    if (!supplierId) { unassigned.push(it); continue }
    const cost = Number(vm.supplier_cost_cents)
    const line: SupplierLine = {
      line_item_id: it.id, title: it.title, variant: it.variant_title ?? null,
      sku: str(vm.supplier_sku) ?? str(it.variant?.sku), quantity: Number(it.quantity),
      unit_cost_cents: Number.isFinite(cost) && cost > 0 ? Math.round(cost) : null,
    }
    bySupplier.set(supplierId, [...(bySupplier.get(supplierId) ?? []), line])
  }
  return { bySupplier, unassigned }
}

/** Coût d'achat total (centimes), ou null si un prix d'achat manque : jamais de marge calculée sur un coût partiel. */
export function costTotalCents(lines: SupplierLine[]): number | null {
  if (lines.some((l) => l.unit_cost_cents === null)) return null
  return lines.reduce((s, l) => s + l.unit_cost_cents! * l.quantity, 0)
}
