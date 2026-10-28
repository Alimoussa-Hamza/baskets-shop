import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { listProducts } from "@/lib/medusa"
import { GENRES, toCard } from "@/lib/catalog"
import { CATEGORY_INTRO, CATEGORY_LABEL } from "@/lib/content"
import { ProductGrid } from "@/components/product-grid"

export const revalidate = 300

async function load(genre: string, category: string) {
  const g = GENRES[genre]
  if (!g) return null
  const products = (await listProducts()).filter((p) => p.metadata?.gender === g.gender && p.categories?.some((c) => c.handle === category))
  return products.length ? { g, products } : null
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string; category: string }> }): Promise<Metadata> {
  const { genre, category } = await params
  const data = await load(genre, category)
  if (!data) return {}
  const label = `${data.g.label} ${CATEGORY_LABEL[category] ?? category}`
  return { title: label, description: `${label} : ${data.products.length} modèle(s), guide des tailles en cm, retours sous 14 jours.`, alternates: { canonical: `/${genre}/${category}` } }
}

export default async function CategoryPage({ params }: { params: Promise<{ genre: string; category: string }> }) {
  const { genre, category } = await params
  const data = await load(genre, category)
  if (!data) notFound()
  const label = CATEGORY_LABEL[category] ?? category
  return (
    <>
      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">Accueil</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/${genre}`} className="hover:text-accent">{data.g.label}</Link> <span aria-hidden="true">›</span> <span className="text-ink">{label}</span>
      </nav>
      <h1 className="mt-4 text-4xl font-bold md:text-5xl">{data.g.label} {label.toLowerCase()}</h1>
      <p className="mt-4 max-w-2xl text-muted">{CATEGORY_INTRO[`${genre}/${category}`] ?? "Introduction à rédiger (100 à 200 mots, unique)."}</p>
      <div className="mt-10"><ProductGrid cards={data.products.map(toCard)} /></div>
    </>
  )
}
