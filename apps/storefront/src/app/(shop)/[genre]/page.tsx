import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { listProducts } from "@/lib/medusa"
import { GENRES, toCard } from "@/lib/catalog"
import { CATEGORY_LABEL, GENRE_INTRO } from "@/lib/content"
import { ProductGrid } from "@/components/product-grid"
import { JsonLd } from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { pageMeta } from "@/lib/seo"

export const revalidate = 300
export const dynamicParams = false
export const generateStaticParams = () => Object.keys(GENRES).map((genre) => ({ genre }))

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }): Promise<Metadata> {
  const { genre } = await params
  const g = GENRES[genre]
  if (!g) return {}
  return pageMeta({ title: g.label, description: `${g.label} : guide des tailles en cm, livraison en France, retours sous 14 jours.`, path: `/${genre}` })
}

export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const { genre } = await params
  const g = GENRES[genre]
  if (!g) notFound()
  const products = (await listProducts()).filter((p) => p.metadata?.gender === g.gender)
  const cats = [...new Set(products.map((p) => p.categories?.[0]?.handle).filter((x): x is string => !!x))]
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: g.label, item: `${SITE_URL}/${genre}` }] }} />
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted"><Link href="/" className="hover:text-accent">Accueil</Link> <span aria-hidden="true">›</span> <span className="text-ink">{g.label}</span></nav>
      <h1 className="mt-4 text-4xl font-bold md:text-5xl">{g.label}</h1>
      <p className="mt-4 max-w-2xl text-muted">{GENRE_INTRO[genre]}</p>
      {cats.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-2" aria-label="Catégories">
          {cats.map((c) => <li key={c}><Link href={`/${genre}/${c}`} className="inline-flex h-11 items-center rounded-full border border-line bg-white px-4 text-sm hover:border-ink">{CATEGORY_LABEL[c] ?? c}</Link></li>)}
        </ul>)}
      <div className="mt-10"><ProductGrid cards={products.map(toCard)} /></div>
    </>
  )
}
