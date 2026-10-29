import Link from "next/link"
import { COLOR_HEX, eur, type Card } from "@/lib/catalog"
import { ProductImage } from "./product-image"

// Carte sans cadre (références : Veja, Allbirds) : visuel sur fond uni, infos dessous ; la grille parente trace les filets.
export function ProductCard({ c, priority = false }: { c: Card; priority?: boolean }) {
  return (
    <article className="group h-full bg-paper">
      <Link href={c.href} className="flex h-full flex-col">
        <div className="relative aspect-square overflow-hidden">
          <ProductImage src={c.image} alt={c.title} color={c.colors[0]} priority={priority} />
          {!c.inStock && <span className="absolute left-3 top-3 bg-ink px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white">Épuisé</span>}
          {c.inStock && c.lowStock && <span className="absolute left-3 top-3 bg-white px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-danger">Dernières paires</span>}
        </div>
        <div className="flex flex-1 flex-col px-4 pb-5 pt-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
            <h3 className="text-[15px] font-semibold uppercase tracking-[0.04em] underline-offset-4 group-hover:underline">{c.title}</h3>
            <p className="whitespace-nowrap text-[15px]">{eur(c.price)}</p>
          </div>
          <p className="mt-0.5 text-sm text-muted">{c.subtitle}</p>
          <ul className="mt-3 flex gap-1.5" aria-label={`Couleurs : ${c.colors.join(", ")}`}>
            {c.colors.map((col) => (
              <li key={col} title={col} className="h-3.5 w-3.5 rounded-full border border-black/20" style={{ background: COLOR_HEX[col] ?? "#ccc" }} />
            ))}
          </ul>
        </div>
      </Link>
    </article>
  )
}
