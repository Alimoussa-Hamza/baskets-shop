import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { listProducts } from "@/lib/medusa"
import { GENRES, toCard } from "@/lib/catalog"
import { CATEGORY_LABEL, GENRE_INTRO } from "@/lib/content"
import { ProductGrid } from "@/components/product-grid"
import { CategoryHero } from "@/components/category-hero"
import { HelpStrip } from "@/components/help-strip"
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
  const cards = products.map(toCard)
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: g.label, item: `${SITE_URL}/${genre}` }] }} />
      <CategoryHero
        color={genre === "baskets-femme" ? "#d9cdb8" : "#1f4fff"}
        title={g.label} intro={GENRE_INTRO[genre]} cards={cards}
        crumbs={<><Link href="/" className="hover:text-accent">Accueil</Link> <span aria-hidden="true">›</span> <span className="text-ink">{g.label}</span></>}
        chips={cats.map((c) => ({ label: CATEGORY_LABEL[c] ?? c, href: `/${genre}/${c}`, count: products.filter((p) => p.categories?.some((x) => x.handle === c)).length }))} />
      <div className="mt-10"><ProductGrid cards={cards} /></div>
      <HelpStrip />
    </>
  )
}
