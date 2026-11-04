"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addToCart } from "@/lib/cart-actions"
import { colorParts, joinColor, swatch, discountPct, eur } from "@/lib/catalog"
import { useProductColor } from "./product-color"

export type VariantLite = { id: string; size: string; color: string; qty: number; price: number; compareAt: number | null }

export function ProductForm({ variants, fitNote, delivery }: { variants: VariantLite[]; fitNote?: string; delivery: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants])
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))].sort((a, b) => Number(a) - Number(b)), [variants])
  const [color, setColor] = useState(colors.find((c) => variants.some((v) => v.color === c && v.qty > 0)) ?? colors[0])
  const [size, setSize] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { setColor: shareColor } = useProductColor()
  useEffect(() => shareColor(color), [color, shareColor]) // l'image principale suit la couleur choisie

  // Coloris « Marron fourrée +8 cm » : couleur, version et réhausse se choisissent séparément
  const current = colorParts(color)
  const parts = useMemo(() => colors.map(colorParts), [colors])
  const bases = useMemo(() => [...new Set(parts.map((p) => p.base))], [parts])
  const finishes = useMemo(() => [...new Set(parts.map((p) => p.finish))], [parts])
  const lifts = useMemo(() => [...new Set(parts.map((p) => p.lift).filter((l): l is string => !!l))].sort((a, b) => Number(a) - Number(b)), [parts])
  // Change un seul critère ; si cette combinaison n'existe pas, garde au mieux les autres
  const choose = (change: Partial<typeof current>) => {
    const want = { ...current, ...change }
    const key = Object.keys(change)[0] as keyof typeof current
    const c = colors.find((x) => x === joinColor(want)) ?? colors.find((x, i) => parts[i][key] === want[key])
    if (c) pick(c)
  }
  const exists = (change: Partial<typeof current>) => colors.includes(joinColor({ ...current, ...change }))
  const pick = (c: string) => { setColor(c); setError(null); if (size && (find(size, c)?.qty ?? 0) < 1) setSize(null) }

  const find = (s: string, c = color) => variants.find((v) => v.size === s && v.color === c)
  const chosen = size ? find(size) : undefined
  const price = chosen?.price ?? Math.min(...variants.map((v) => v.price))
  // Prix barré : celui de la variante choisie, sinon de la moins chère
  const ref = chosen ? chosen.compareAt : (variants.find((v) => v.price === price)?.compareAt ?? null)

  function submit() {
    setError(null)
    if (!chosen) return setError("Choisissez une taille avant d'ajouter au panier.")
    if (chosen.qty < 1) return setError("Cette taille est épuisée dans cette couleur.")
    start(async () => {
      const r = await addToCart(chosen.id, 1)
      if (r.ok) router.push("/panier")
      else setError(r.error)
    })
  }

  return (
    <div>
      <p className="flex flex-wrap items-baseline gap-x-3 text-2xl font-medium">
        {ref && <s className="text-lg text-muted" aria-label={`Prix de référence ${eur(ref)}`}>{eur(ref)}</s>}
        <span className={ref ? "text-accent" : ""}>{eur(price)}</span>
        {ref && <span className="bg-accent px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-white">−{discountPct(price, ref)} %</span>}
      </p>
      {ref && <p className="mt-1 text-xs text-muted">Prix barré : prix le plus bas pratiqué sur les 30 derniers jours.</p>}

      <fieldset className="mt-6">
        <legend className="text-sm">Couleur : <span className="font-medium">{current.base}</span></legend>
        <div className="mt-2 flex gap-3">
          {bases.map((b) => (
            <button key={b} type="button" aria-pressed={b === current.base} aria-label={b} title={b}
              onClick={() => choose({ base: b })}
              className={`h-11 w-11 rounded-full border-2 p-1 ${b === current.base ? "border-accent" : "border-transparent"}`}>
              <span className="block h-full w-full rounded-full border border-black/20" style={{ background: swatch(b) }} />
            </button>))}
        </div>
      </fieldset>

      {finishes.length > 1 && (
        <fieldset className="mt-6">
          <legend className="text-sm">Version : <span className="font-medium">{current.finish ? current.finish.replace(/^./, (x) => x.toUpperCase()) : "Standard"}</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {finishes.map((f) => (
              <button key={f ?? "standard"} type="button" aria-pressed={f === current.finish} disabled={!exists({ finish: f })}
                onClick={() => choose({ finish: f })}
                className={`h-11 rounded-[8px] border px-4 text-sm ${f === current.finish ? "border-accent font-semibold text-accent ring-1 ring-accent" : "border-line bg-white hover:border-ink"} disabled:cursor-not-allowed disabled:opacity-40`}>
                {f ? f.replace(/^./, (x) => x.toUpperCase()) : "Standard"}
              </button>))}
          </div>
        </fieldset>)}

      {lifts.length > 0 && (
        <fieldset className="mt-6">
          <legend className="text-sm">Réhausse : <span className="font-medium">+{current.lift} cm</span></legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {lifts.map((l) => {
              const missing = !exists({ lift: l })
              return (
                <button key={l} type="button" aria-pressed={l === current.lift} disabled={missing} aria-label={`Réhausse +${l} cm`}
                  onClick={() => choose({ lift: l })}
                  className={`h-11 min-w-16 rounded-[8px] border px-3 text-sm ${l === current.lift ? "border-accent font-semibold text-accent ring-1 ring-accent" : "border-line bg-white hover:border-ink"} ${missing ? "cursor-not-allowed opacity-40" : ""}`}>
                  +{l} cm
                </button>)
            })}
          </div>
          <p className="mt-2 text-xs text-muted">Hauteur gagnée annoncée par le fabricant, semelle intérieure comprise.</p>
        </fieldset>)}

      <fieldset className="mt-6">
        <div className="flex items-baseline justify-between">
          <legend className="text-sm font-medium">Choisir la taille EU</legend>
          <Link href="/guide-des-tailles" className="link text-sm">Guide des tailles</Link>
        </div>
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-4 xl:grid-cols-5">
          {sizes.map((s) => {
            const v = find(s); const out = !v || v.qty < 1; const low = !!v && v.qty > 0 && v.qty <= 3
            return (
              <button key={s} type="button" aria-pressed={size === s} aria-disabled={out} disabled={out}
                aria-label={`Taille ${s}${out ? ", épuisée" : low ? `, plus que ${v!.qty}` : ""}`}
                onClick={() => { setSize(s); setError(null) }}
                className={`relative h-12 rounded-[8px] border text-sm ${size === s ? "border-accent font-semibold text-accent ring-1 ring-accent" : "border-line bg-white hover:border-ink"} ${out ? "cursor-not-allowed text-muted line-through opacity-50" : ""}`}>
                {s}
                {low && <span className="absolute -top-2 right-0 rounded bg-danger px-1 text-[10px] font-semibold leading-4 text-white">Plus que {v!.qty}</span>}
              </button>)
          })}
        </div>
        {fitNote && <p className="mt-3 text-sm text-muted">{fitNote}</p>}
      </fieldset>

      {error && <p role="alert" className="mt-4 text-sm font-medium text-danger">{error}</p>}
      <button type="button" onClick={submit} disabled={pending} className="btn-primary mt-6 w-full">{pending ? "Ajout…" : "Ajouter au panier"}</button>
      <ul className="mt-4 flex justify-between border-t border-line pt-4 text-xs uppercase tracking-wide text-muted">
        <li>Livraison {delivery.replace(" à ", "-")} jours ouvrés</li><li>Retours sous 14 jours</li>
      </ul>
    </div>
  )
}
