import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { listProducts } from "@/lib/medusa"
import { GENRES, toCard } from "@/lib/catalog"
import { CATEGORY_INTRO, CATEGORY_LABEL } from "@/lib/content"
import { ProductGrid } from "@/components/product-grid"
import { CategoryHero } from "@/components/category-hero"
import { HelpStrip } from "@/components/help-strip"
import { JsonLd } from "@/components/json-ld"
import { breadcrumbJsonLd } from "@/lib/jsonld"
import { pageMeta } from "@/lib/seo"
import { SITE_URL } from "@/lib/site"

export const revalidate = 300

async function load(genre: string, category: string) {
  const g = GENRES[genre]
  if (!g) return null
  const products = (await listProducts()).filter((p) => p.metadata?.gender === g.gender && p.categories?.some((c) => c.handle === category))
  const all = (await listProducts()).filter((p) => p.metadata?.gender === g.gender)
  return products.length ? { g, products, all } : null
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string; category: string }> }): Promise<Metadata> {
  const { genre, category } = await params
  const data = await load(genre, category)
  if (!data) return {}
  const label = `${data.g.label} ${(CATEGORY_LABEL[category] ?? category).toLowerCase()}`
  const n = data.products.length
  return pageMeta({ title: label, description: `${label} : ${n} modèle${n > 1 ? "s" : ""}, guide des tailles en cm, livraison en France, retours sous 14 jours.`, path: `/${genre}/${category}` })
}

export default async function CategoryPage({ params }: { params: Promise<{ genre: string; category: string }> }) {
  const { genre, category } = await params
  const data = await load(genre, category)
  if (!data) notFound()
  const label = CATEGORY_LABEL[category] ?? category
  const cards = data.products.map(toCard)
  const siblings = [...new Set(data.all.map((p) => p.categories?.[0]?.handle).filter((x): x is string => !!x))]
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([
        { name: "Accueil", url: SITE_URL }, { name: data.g.label, url: `${SITE_URL}/${genre}` },
        { name: label, url: `${SITE_URL}/${genre}/${category}` }])} />
      <CategoryHero
        color={genre === "baskets-femme" ? "#d9cdb8" : "#1f4fff"}
        title={`${data.g.label} ${label.toLowerCase()}`} intro={CATEGORY_INTRO[`${genre}/${category}`]} cards={cards}
        crumbs={<><Link href="/" className="hover:text-accent">Accueil</Link> <span aria-hidden="true">›</span>{" "}
          <Link href={`/${genre}`} className="hover:text-accent">{data.g.label}</Link> <span aria-hidden="true">›</span> <span className="text-ink">{label}</span></>}
        chips={siblings.map((c) => ({ label: CATEGORY_LABEL[c] ?? c, href: `/${genre}/${c}`, active: c === category, count: data.all.filter((p) => p.categories?.some((x) => x.handle === c)).length }))} />
      <div className="mt-10"><ProductGrid cards={cards} /></div>
      <HelpStrip />
    </>
  )
}
