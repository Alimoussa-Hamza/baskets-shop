"use client"

import Link from "next/link"
import { useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { addToCart } from "@/lib/cart-actions"
import { COLOR_HEX, eur } from "@/lib/catalog"

export type VariantLite = { id: string; size: string; color: string; qty: number; price: number }

export function ProductForm({ variants, fitNote }: { variants: VariantLite[]; fitNote?: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const colors = useMemo(() => [...new Set(variants.map((v) => v.color))], [variants])
  const sizes = useMemo(() => [...new Set(variants.map((v) => v.size))].sort((a, b) => Number(a) - Number(b)), [variants])
  const [color, setColor] = useState(colors.find((c) => variants.some((v) => v.color === c && v.qty > 0)) ?? colors[0])
  const [size, setSize] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const find = (s: string, c = color) => variants.find((v) => v.size === s && v.color === c)
  const chosen = size ? find(size) : undefined
  const price = chosen?.price ?? Math.min(...variants.map((v) => v.price))

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
      <p className="text-2xl font-medium">{eur(price)}</p>

      <fieldset className="mt-6">
        <legend className="text-sm">Couleur : <span className="font-medium">{color}</span></legend>
        <div className="mt-2 flex gap-3">
          {colors.map((c) => (
            <button key={c} type="button" aria-pressed={c === color} aria-label={c} title={c}
              onClick={() => { setColor(c); setError(null); if (size && (find(size, c)?.qty ?? 0) < 1) setSize(null) }}
              className={`h-11 w-11 rounded-full border-2 p-1 ${c === color ? "border-accent" : "border-transparent"}`}>
              <span className="block h-full w-full rounded-full border border-black/20" style={{ background: COLOR_HEX[c] ?? "#ccc" }} />
            </button>))}
        </div>
      </fieldset>

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
        <li>Livraison 2-4 jours ouvrés</li><li>Retours sous 14 jours</li>
      </ul>
    </div>
  )
}
