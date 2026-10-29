import Link from "next/link"
import type { ReactNode } from "react"
import { SneakerArt, tint } from "./sneaker-art"
import { eur, type Card } from "@/lib/catalog"

export type Chip = { label: string; href: string; count: number; active?: boolean }

// Bandeau d'en-tête des pages de listing : pleine largeur, teinte douce, illustration de basket, chiffres issus du catalogue.
// Les chiffres (modèles, tailles, prix) viennent des données : aucun texte éditorial inventé.
export function CategoryHero({ crumbs, title, intro, cards, chips, color }: {
  crumbs: ReactNode; title: string; intro?: string; cards: Card[]; chips: Chip[]; color: string
}) {
  const prices = cards.map((c) => c.price).filter((p) => p > 0)
  const sizes = cards.flatMap((c) => c.sizesInStock).map(Number).filter(Number.isFinite)
  const facts = [
    `${cards.length} modèle${cards.length > 1 ? "s" : ""}`,
    sizes.length ? `Du ${Math.min(...sizes)} au ${Math.max(...sizes)}` : null,
    prices.length ? `Dès ${eur(Math.min(...prices))}` : null,
  ].filter(Boolean) as string[]
  return (
    <section className="relative -mt-8 mx-[calc(50%-50vw)] overflow-hidden" style={{ background: tint(color, 0.16) }}>
      <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full" style={{ background: tint(color, 0.14, "#ffffff") }} />
      <div className="relative mx-auto grid max-w-[1200px] items-center gap-6 px-4 py-10 md:grid-cols-[1.3fr_1fr] md:py-14">
        <div>
          <nav aria-label="Fil d'Ariane" className="text-sm text-muted">{crumbs}</nav>
          <h1 className="mt-4 text-4xl font-bold leading-tight md:text-6xl">{title}</h1>
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="En bref">
            {facts.map((f) => <li key={f} className="rounded-full bg-white/80 px-3.5 py-1.5 text-sm font-medium">{f}</li>)}
          </ul>
          {intro && <p className="mt-5 max-w-xl text-muted">{intro}</p>}
          {chips.length > 0 && (
            <ul className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
              {chips.map((c) => (
                <li key={c.href}>
                  <Link href={c.href} aria-current={c.active ? "page" : undefined}
                    className={`inline-flex h-11 items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors ${c.active ? "border-ink bg-ink text-white" : "border-ink/15 bg-white hover:border-ink"}`}>
                    {c.label}<span className={`text-xs ${c.active ? "text-white/70" : "text-muted"}`}>{c.count}</span>
                  </Link>
                </li>))}
            </ul>)}
        </div>
        <div aria-hidden="true" className="hidden md:block">
          <SneakerArt color={color === "#d9cdb8" ? "#f4f3ee" : "#ffffff"} className="w-full max-w-[420px] -rotate-6 drop-shadow-[0_24px_30px_rgba(17,17,17,0.25)]" />
        </div>
      </div>
    </section>
  )
}
