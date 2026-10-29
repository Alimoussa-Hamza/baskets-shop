"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { COLOR_HEX, eur, type Card } from "@/lib/catalog"
import { ProductCard } from "./product-card"

type Sort = "pertinence" | "prix-asc" | "prix-desc"
const PAGE = 12

// Filtrage côté navigateur : aucune URL filtrée n'existe, donc rien à désindexer ; la page reste statique (ISR).
// Les combinaisons à vraie demande (ex. /baskets-femme/running) sont de vraies catégories, avec leur propre texte.
// Mobile et tablette : barre compacte + panneau (bas d'écran sur mobile, côté droit sur tablette). Ordinateur : colonne latérale.
export function ProductGrid({ cards }: { cards: Card[] }) {
  const [size, setSize] = useState<string | null>(null)
  const [color, setColor] = useState<string | null>(null)
  const [maxPrice, setMaxPrice] = useState<number | null>(null)
  const [sort, setSort] = useState<Sort>("pertinence")
  const [shown, setShown] = useState(PAGE)
  const [sheet, setSheet] = useState(false)
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

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

  const active = [
    size && { label: `Taille ${size}`, clear: () => setSize(null) },
    color && { label: color, clear: () => setColor(null) },
    maxPrice !== null && maxPrice < hi && { label: `Jusqu'à ${eur(maxPrice)}`, clear: () => setMaxPrice(null) },
  ].filter(Boolean) as { label: string; clear: () => void }[]
  const reset = () => { setSize(null); setColor(null); setMaxPrice(null); setShown(PAGE) }
  const count = `${list.length} résultat${list.length > 1 ? "s" : ""}`

  // Panneau ouvert : page figée, Échap ferme, focus sur « Fermer » puis rendu au bouton « Filtres ».
  useEffect(() => {
    if (!sheet) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheet(false) }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); openerRef.current?.focus() }
  }, [sheet])

  const heading = "text-xs font-semibold uppercase tracking-[0.12em]"
  const sizeChip = (on: boolean) => `h-11 rounded-[8px] border text-sm transition-colors ${on ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white hover:border-ink"}`
  const colorChip = (on: boolean) => `inline-flex h-10 items-center gap-2 rounded-full border pl-1.5 pr-3.5 text-sm transition-colors ${on ? "border-ink bg-ink font-semibold text-white" : "border-line bg-white hover:border-ink"}`

  // Rendu deux fois (colonne et panneau) : `idp` garde des id uniques.
  const panel = (idp: string) => (
    <div className="divide-y divide-line">
      {sizes.length > 0 && (
        <div role="group" aria-labelledby={`${idp}-taille`} className="pb-6">
          <h3 id={`${idp}-taille`} className={heading}>Taille EU</h3>
          <div className="mt-3 grid grid-cols-5 gap-2 lg:grid-cols-4">{sizes.map((s) => (
            <button key={s} type="button" aria-pressed={size === s} className={sizeChip(size === s)} onClick={() => { setSize(size === s ? null : s); setShown(PAGE) }}>{s}</button>))}
          </div>
        </div>)}
      {colors.length > 0 && (
        <div role="group" aria-labelledby={`${idp}-couleur`} className="py-6">
          <h3 id={`${idp}-couleur`} className={heading}>Couleur</h3>
          <div className="mt-3 flex flex-wrap gap-2">{colors.map((c) => (
            <button key={c} type="button" aria-pressed={color === c} onClick={() => { setColor(color === c ? null : c); setShown(PAGE) }} className={colorChip(color === c)}>
              <span aria-hidden="true" className="h-7 w-7 rounded-full border border-black/15" style={{ background: COLOR_HEX[c] ?? "#ccc" }} />{c}</button>))}
          </div>
        </div>)}
      {hi > lo && (
        <div className="pt-6">
          <div className="flex items-baseline justify-between">
            <label htmlFor={`${idp}-prix`} className={heading}>Prix maximum</label>
            <span className="text-sm font-semibold">{eur(cap)}</span>
          </div>
          <input id={`${idp}-prix`} type="range" min={lo} max={hi} step={5} value={cap} onChange={(e) => { setMaxPrice(Number(e.target.value)); setShown(PAGE) }} className="mt-4 w-full accent-ink" />
          <div className="mt-1 flex justify-between text-xs text-muted"><span>{eur(lo)}</span><span>{eur(hi)}</span></div>
        </div>)}
    </div>
  )

  return (
    <div className="grid gap-10 lg:grid-cols-[260px_1fr]">
      <aside aria-label="Filtres" className="hidden lg:block lg:sticky lg:top-24 lg:self-start">
        <div className="mb-6 flex items-center justify-between border-b border-line pb-4">
          <h2 className="text-sm font-semibold uppercase tracking-[0.12em]">Filtres</h2>
          {active.length > 0 && <button type="button" onClick={reset} className="link text-sm">Effacer</button>}
        </div>
        {panel("col")}
      </aside>

      <section aria-label="Résultats">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <button ref={openerRef} type="button" onClick={() => setSheet(true)} aria-haspopup="dialog" aria-expanded={sheet}
            className="inline-flex h-11 items-center gap-2 rounded-[8px] border border-line bg-white px-4 text-sm font-medium hover:border-ink lg:hidden">
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" /><circle cx="16" cy="6" r="2" /><circle cx="10" cy="12" r="2" /><circle cx="18" cy="18" r="2" /></svg>
            Filtres
            {active.length > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1.5 text-xs font-semibold text-white">{active.length}</span>}
          </button>
          <p className="ml-auto text-sm text-muted" aria-live="polite">{count}</p>
          <label className="text-sm"><span className="sr-only">Trier par</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="h-11 rounded-[8px] border border-line bg-white px-3 text-sm font-medium">
              <option value="pertinence">Trier : pertinence</option>
              <option value="prix-asc">Prix croissant</option>
              <option value="prix-desc">Prix décroissant</option>
            </select></label>
        </div>

        {active.length > 0 && (
          <ul className="mt-4 flex flex-wrap items-center gap-2" aria-label="Filtres actifs">
            {active.map((a) => (
              <li key={a.label}><button type="button" onClick={() => { a.clear(); setShown(PAGE) }} aria-label={`Retirer le filtre ${a.label}`}
                className="inline-flex h-9 items-center gap-2 rounded-full border border-line bg-white pl-3.5 pr-2.5 text-sm hover:border-ink">
                {a.label}<span aria-hidden="true" className="text-muted">✕</span></button></li>))}
            <li><button type="button" onClick={reset} className="link ml-1 text-sm">Tout effacer</button></li>
          </ul>)}

        <div className="mt-6">
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
        </div>
      </section>

      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheet(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-labelledby="sheet-title"
            className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-[16px] bg-paper shadow-2xl md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[420px] md:rounded-none">
            <div className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 id="sheet-title" className="text-lg font-semibold">Filtres</h2>
              <button ref={closeRef} type="button" onClick={() => setSheet(false)} aria-label="Fermer les filtres" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-black/5">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-6">{panel("sheet")}</div>
            <div className="flex gap-3 border-t border-line bg-white px-5 py-4">
              <button type="button" onClick={reset} disabled={active.length === 0} className="btn-secondary flex-1 disabled:opacity-40">Effacer</button>
              <button type="button" onClick={() => setSheet(false)} className="btn-primary flex-[2]">Voir {count}</button>
            </div>
          </div>
        </div>)}
    </div>
  )
}
