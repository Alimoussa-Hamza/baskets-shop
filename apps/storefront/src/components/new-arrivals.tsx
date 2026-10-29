"use client"

import Link from "next/link"
import { useState } from "react"
import type { Card } from "@/lib/catalog"
import { ProductCard } from "./product-card"

// Nouveautés par univers, avec onglets (référence : Allbirds). Galerie bord à bord ; défilement horizontal sur mobile.
export function NewArrivals({ tabs }: { tabs: { key: string; label: string; href: string; cards: Card[] }[] }) {
  const [active, setActive] = useState(tabs[0]?.key)
  const tab = tabs.find((t) => t.key === active) ?? tabs[0]
  if (!tab) return null
  return (
    <div>
      <div role="tablist" aria-label="Univers" className="mx-auto flex max-w-[1200px] gap-8 px-4">
        {tabs.map((t) => (
          <button key={t.key} role="tab" type="button" aria-selected={t.key === tab.key} aria-controls={`nouveautes-${t.key}`} onClick={() => setActive(t.key)}
            className={`-mb-px border-b-2 pb-3 text-sm font-semibold uppercase tracking-[0.14em] ${t.key === tab.key ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"}`}>
            {t.label}
          </button>))}
      </div>
      <div id={`nouveautes-${tab.key}`} role="tabpanel" className="border-t border-line">
        <ul className="gallery snap-x snap-mandatory grid-flow-col auto-cols-[72%] overflow-x-auto border-t-0 sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
          {tab.cards.map((c, i) => <li key={c.id} className="snap-start"><ProductCard c={c} priority={i < 2} /></li>)}
        </ul>
        <p className="mx-auto max-w-[1200px] px-4 pt-6"><Link href={tab.href} className="group inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em]">Tout voir · {tab.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></Link></p>
      </div>
    </div>
  )
}
