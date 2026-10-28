"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { applyPromo, updateLine } from "@/lib/cart-actions"
import { eur } from "@/lib/catalog"
import type { CartItem } from "@/lib/cart-data"
import { ProductImage } from "./product-image"

export function CartLines({ items }: { items: CartItem[] }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [promo, setPromo] = useState("")
  const [promoOpen, setPromoOpen] = useState(false)

  const change = (id: string, q: number) => start(async () => { const r = await updateLine(id, q); if (!r.ok) setError(r.error); else { setError(null); router.refresh() } })
  const submitPromo = (e: React.FormEvent) => { e.preventDefault(); start(async () => { const r = await applyPromo(promo); if (!r.ok) setError(r.error); else { setError(null); setPromo(""); router.refresh() } }) }

  return (
    <div aria-busy={pending}>
      <ul className="divide-y divide-line border-y border-line">
        {items.map((i) => (
          <li key={i.id} className="flex gap-4 py-6">
            <div className="relative h-32 w-28 shrink-0 overflow-hidden rounded-[8px]"><ProductImage src={i.thumbnail ?? null} alt={i.title} sizes="112px" /></div>
            <div className="flex flex-1 flex-col">
              <div className="flex justify-between gap-4">
                <div>
                  <h2 className="font-display text-lg font-semibold">{i.title}</h2>
                  <p className="text-sm text-muted">Pointure / couleur : {i.variant_title}</p>
                </div>
                <p className="whitespace-nowrap font-medium">{eur(i.total)}</p>
              </div>
              <div className="mt-auto flex items-center justify-between pt-4">
                <div className="inline-flex items-center rounded-[8px] border border-line bg-white" role="group" aria-label={`Quantité de ${i.title}`}>
                  <button type="button" className="h-11 w-11" aria-label="Retirer une paire" disabled={pending} onClick={() => change(i.id, i.quantity - 1)}>−</button>
                  <span className="w-10 text-center" aria-live="polite">{i.quantity}</span>
                  <button type="button" className="h-11 w-11" aria-label="Ajouter une paire" disabled={pending || i.quantity >= 10} onClick={() => change(i.id, i.quantity + 1)}>+</button>
                </div>
                <button type="button" className="min-h-11 px-2 text-sm font-medium uppercase tracking-wide text-muted hover:text-danger" disabled={pending} onClick={() => change(i.id, 0)}>Supprimer</button>
              </div>
            </div>
          </li>))}
      </ul>
      {error && <p role="alert" className="mt-4 text-sm font-medium text-danger">{error}</p>}
      <div className="mt-6">
        <button type="button" aria-expanded={promoOpen} onClick={() => setPromoOpen(!promoOpen)} className="text-sm font-medium uppercase tracking-wide">Code promotionnel {promoOpen ? "−" : "+"}</button>
        {promoOpen && (
          <form onSubmit={submitPromo} className="mt-3 flex max-w-sm gap-2">
            <label className="sr-only" htmlFor="promo">Code promotionnel</label>
            <input id="promo" className="field" value={promo} onChange={(e) => setPromo(e.target.value)} autoComplete="off" />
            <button className="btn-secondary" disabled={pending}>Appliquer</button>
          </form>)}
      </div>
    </div>
  )
}
