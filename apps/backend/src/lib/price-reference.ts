// Prix de référence d'une réduction (art. L112-1-1 du Code de la consommation) : le prix barré affiché doit être
// le prix le plus bas pratiqué pendant les 30 jours précédant la réduction. Medusa ne garde pas l'historique :
// on mémorise chaque jour le prix de base de chaque variante (métadonnées price_history / price_ref_30d).

export type PriceHistory = [day: string, amount: number][] // ["2026-10-29", 139]

const DAY = 86_400_000
export const isoDay = (d: Date) => d.toISOString().slice(0, 10)

/** Ajoute (ou remplace) le prix du jour et ne garde que les 31 derniers jours. */
export function recordPrice(history: PriceHistory | null | undefined, today: Date, amount: number): PriceHistory {
  const day = isoDay(today)
  const keepFrom = isoDay(new Date(today.getTime() - 30 * DAY))
  const rest = (history ?? []).filter(([d]) => d !== day && d >= keepFrom)
  const entry: [string, number] = [day, amount]
  return [...rest, entry].sort((a, b) => a[0].localeCompare(b[0]))
}

/** Prix le plus bas des 30 derniers jours (jour courant inclus), ou null sans historique : pas de prix barré. */
export function lowestIn30Days(history: PriceHistory | null | undefined, today: Date): number | null {
  const from = isoDay(new Date(today.getTime() - 30 * DAY))
  const amounts = (history ?? []).filter(([d]) => d >= from).map(([, a]) => a)
  return amounts.length ? Math.min(...amounts) : null
}
