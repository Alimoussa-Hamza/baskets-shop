// Répartition des lignes d'une commande par fournisseur (dropshipping).
// Lien variante → fournisseur dans la table privée supplier_variant du module fournisseur (jamais dans les
// métadonnées des variantes : l'API publique de la boutique les expose, prix d'achat compris).

/** Anciennes clés (avant la table supplier_variant) à purger des métadonnées : "" supprime une clé (convention Medusa). */
export const LEGACY_SUPPLIER_METADATA = { supplier_id: "", supplier_sku: "", supplier_cost_cents: "" }

export type OrderLine = {
  id: string; title: string; variant_title?: string | null; quantity: number | string
  variant_id?: string | null; variant?: { sku?: string | null } | null
}

/** Ligne de la table supplier_variant, indexée par variant_id. */
export type VariantSourcing = { supplier_id: string; sku: string | null; cost_cents: number | null }

export type SupplierLine = {
  line_item_id: string; title: string; variant: string | null; sku: string | null; quantity: number; unit_cost_cents: number | null
}

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null)

export function groupLinesBySupplier(items: OrderLine[], sourcing: Map<string, VariantSourcing>): { bySupplier: Map<string, SupplierLine[]>; unassigned: OrderLine[] } {
  const bySupplier = new Map<string, SupplierLine[]>()
  const unassigned: OrderLine[] = []
  for (const it of items) {
    const src = it.variant_id ? sourcing.get(it.variant_id) : undefined
    if (!src) { unassigned.push(it); continue }
    const cost = Number(src.cost_cents)
    const line: SupplierLine = {
      line_item_id: it.id, title: it.title, variant: it.variant_title ?? null,
      sku: str(src.sku) ?? str(it.variant?.sku), quantity: Number(it.quantity),
      unit_cost_cents: Number.isFinite(cost) && cost > 0 ? Math.round(cost) : null,
    }
    bySupplier.set(src.supplier_id, [...(bySupplier.get(src.supplier_id) ?? []), line])
  }
  return { bySupplier, unassigned }
}

/** Coût d'achat total (centimes), ou null si un prix d'achat manque : jamais de marge calculée sur un coût partiel. */
export function costTotalCents(lines: SupplierLine[]): number | null {
  if (lines.some((l) => l.unit_cost_cents === null)) return null
  return lines.reduce((s, l) => s + l.unit_cost_cents! * l.quantity, 0)
}
