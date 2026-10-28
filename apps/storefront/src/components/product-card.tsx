import Link from "next/link"
import { COLOR_HEX, eur, type Card } from "@/lib/catalog"
import { ProductImage } from "./product-image"

export function ProductCard({ c, priority = false }: { c: Card; priority?: boolean }) {
  return (
    <article className="group card overflow-hidden transition-shadow hover:shadow-md">
      <Link href={c.href} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-[#ececE6]">
          <ProductImage src={c.image} alt={c.title} priority={priority} />
          {!c.inStock && <span className="absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Épuisé</span>}
          {c.inStock && c.lowStock && <span className="absolute left-3 top-3 rounded-full bg-danger px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">Dernières paires</span>}
        </div>
        <div className="p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="font-display text-base font-semibold">{c.title}</h3>
            <p className="whitespace-nowrap text-base font-medium">{eur(c.price)}</p>
          </div>
          <p className="mt-0.5 text-sm text-muted">{c.subtitle}</p>
          <ul className="mt-3 flex gap-1.5" aria-label={`Couleurs : ${c.colors.join(", ")}`}>
            {c.colors.map((col) => (
              <li key={col} title={col} className="h-4 w-4 rounded-full border border-black/20" style={{ background: COLOR_HEX[col] ?? "#ccc" }} />
            ))}
          </ul>
        </div>
      </Link>
    </article>
  )
}
