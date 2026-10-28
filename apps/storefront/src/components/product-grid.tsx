"use client"

import { useMemo, useState } from "react"
import { COLOR_HEX, eur, type Card } from "@/lib/catalog"
import { ProductCard } from "./product-card"

type Sort = "pertinence" | "prix-asc" | "prix-desc"
const PAGE = 12

// Filtrage côté navigateur : aucune URL filtrée n'existe, donc rien à désindexer ; la page reste statique (ISR).
// Les combinaisons à vraie demande (ex. /baskets-femme/running) sont de vraies catégories, avec leur propre texte.
export function ProductGrid({ cards }: { cards: Card[] }) {
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>("pertinence")
  const [shown, setShown] = useState(PAGE)

  const sizes = useMemo(() => [...new Set(cards.flatMap((c) => c.sizesInStock))].sort((a, b) => Number(a) - Number(b)), [cards])
  const colors = useMemo(() => [...new Set(cards.flatMap((c) => c.colors))], [cards])
  const prices = cards.map((c) => c.price)
  const lo = Math.floor(Math.min(...prices, Infinity) || 0)
  const hi = Math.ceil(Math.max(...prices, 0))
  const cap = maxPrice ?? hi

  const list = useMemo(() => {
    const out = cards.filter((c) => (!size || c.sizesInStock.includes(size)) && (!color || c.colors.includes(color)) && c.price <= cap)
    if (sort === "prix-asc") out.sort((a, b) => a.price - b.price)
    if (sort === "prix-desc") out.sort((a, b) => b.price - a.price)
    return out
  }, [cards, size, color, cap, sort])

  const active = [size && `Taille ${size}`, color, maxPrice !== null && maxPrice < hi && `Jusqu'à ${eur(maxPrice)}`].filter(Boolean) as string[]
  const reset = () => { setSize(null); setColor(null); setMaxPrice(null); setShown(PAGE) }
  const chip = (on: boolean) => `h-11 min-w-11 rounded-[8px] border px-3 text-sm ${on ? "border-accent bg-white font-semibold text-accent ring-1 ring-accent" : "border-line bg-white hover:border-ink"}`

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <aside aria-label="Filtres">
        <details className="lg:open" open>
          <summary className="cursor-pointer py-2 text-sm font-semibold uppercase tracking-[0.12em] lg:pointer-events-none">Filtres</summary>
          <div className="mt-4 space-y-7">
            {sizes.length > 0 && (
              <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]">Taille EU</legend>
                <div className="flex flex-wrap gap-2">{sizes.map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} className={chip(size === s)} onClick={() => { setSize(size === s ? null : s); setShown(PAGE) }}>{s}</button>))}
                </div></fieldset>)}
            {colors.length > 0 && (
              <fieldset><legend className="mb-2 text-xs font-semibold uppercase tracking-[0.12em]">Couleur</legend>
                <div className="flex flex-wrap gap-3">{colors.map((c) => (
                  <button key={c} type="button" aria-pressed={color === c} aria-label={c} title={c} onClick={() => { setColor(color === c ? null : c); setShown(PAGE) }}
                    className={`h-11 w-11 rounded-full border-2 p-1 ${color === c ? "border-accent" : "border-transparent"}`}>
                    <span className="block h-full w-full rounded-full border border-black/20" style={{ background: COLOR_HEX[c] ?? "#ccc" }} /></button>))}
                </div></fieldset>)}
            {hi > lo && (
              <div><label htmlFor="prix" className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em]">Prix maximum : {eur(cap)}</label>
                <input id="prix" type="range" min={lo} max={hi} value={cap} onChange={(e) => { setMaxPrice(Number(e.target.value)); setShown(PAGE) }} className="w-full accent-accent" />
                <div className="flex justify-between text-xs text-muted"><span>{eur(lo)}</span><span>{eur(hi)}</span></div></div>)}
          </div>
        </details>
      </aside>

      <section aria-label="Résultats">
        <div className="mb-5 flex flex-wrap items-center gap-3 border-b border-line pb-4">
          {active.length > 0 && (<>
            <span className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Filtres actifs</span>
            {active.map((a) => <span key={a} className="rounded-full border border-line bg-white px-3 py-1 text-xs font-medium">{a}</span>)}
            <button type="button" onClick={reset} className="link text-xs">Effacer tout</button></>)}
          <p className="ml-auto text-sm text-muted" aria-live="polite">{list.length} résultat{list.length > 1 ? "s" : ""}</p>
          <label className="text-sm"><span className="sr-only">Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-medium">
              <option value="pertinence">Trier par : pertinence</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix décroissant</option>
            </select></label>
        </div>

        {list.length === 0 ? (
          <div className="card p-8 text-center"><p className="font-medium">Aucun modèle ne correspond à ces filtres.</p>
            <button type="button" onClick={reset} className="btn-secondary mt-4">Effacer les filtres</button></div>
        ) : (<>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-3">
            {list.slice(0, shown).map((c, i) => <li key={c.id}><ProductCard c={c} priority={i < 3} /></li>)}
          </ul>
          <div className="mt-8 flex items-center justify-between text-sm text-muted">
            <span>Affichage de 1-{Math.min(shown, list.length)} sur {list.length}</span>
            {shown < list.length && <button type="button" className="btn-secondary" onClick={() => setShown(shown + PAGE)}>Afficher plus</button>}
          </div></>)}
      </section>
    </div>
  )
}
