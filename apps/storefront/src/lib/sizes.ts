// Table longueur de pied (cm) → pointure EU. DONNÉES DE DÉMO [H] : à remplacer par les tables du fabricant,
// qui varient d'une marque à l'autre (module size-guide du backend).
export const SIZE_TABLE: { cm: number; eu: number; uk: number; us: number }[] = [
  { cm: 22.8, eu: 36, uk: 3.5, us: 5 }, { cm: 23.5, eu: 37, uk: 4, us: 6 }, { cm: 24.1, eu: 38, uk: 5, us: 7 },
  { cm: 24.8, eu: 39, uk: 6, us: 8 }, { cm: 25.4, eu: 40, uk: 6.5, us: 8.5 }, { cm: 26.1, eu: 41, uk: 7.5, us: 9.5 },
  { cm: 26.7, eu: 42, uk: 8, us: 10 }, { cm: 27.4, eu: 43, uk: 9, us: 10.5 }, { cm: 28.0, eu: 44, uk: 9.5, us: 11 }, { cm: 28.7, eu: 45, uk: 10.5, us: 12 },
]
/** Plus petite pointure dont la longueur de pied est ≥ à la mesure. Hors plage : null. */
export function recommend(cm: number) {
  if (!Number.isFinite(cm) || cm < 20 || cm > 32) return null
  return SIZE_TABLE.find((r) => r.cm >= cm) ?? null
}
