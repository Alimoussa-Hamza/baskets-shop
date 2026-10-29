import type { Metadata } from "next"
import Link from "next/link"
import { notFound, permanentRedirect } from "next/navigation"
import { getProduct, listProducts } from "@/lib/medusa"
import { GENRES, eur, minPrice, optionValue, productPath, toCard, genreSlug } from "@/lib/catalog"
import { CATEGORY_LABEL } from "@/lib/content"
import { ProductForm, type VariantLite } from "@/components/product-form"
import { ProductImage } from "@/components/product-image"
import { ProductCard } from "@/components/product-card"
import { JsonLd } from "@/components/json-ld"
import { SITE_URL } from "@/lib/site"
import { productJsonLd, breadcrumbJsonLd } from "@/lib/jsonld"
import { pageMeta } from "@/lib/seo"

export const revalidate = 300

export async function generateStaticParams() {
  try {
    return (await listProducts()).map((p) => {
      const [, genre, category, handle] = productPath(p).split("/")
      return { genre, category, handle }
    })
  } catch { return [] } // pages générées à la demande (ISR) si le backend n'est pas joignable au build
}

type P = { params: Promise<{ genre: string; category: string; handle: string }> }

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { handle } = await params
  const p = await getProduct(handle)
  if (!p) return {}
  return pageMeta({
    title: `${p.title} – ${p.subtitle ?? "Baskets"}`,
    description: `${p.title} à ${eur(minPrice(p))} : tailles ${GENRES[genreSlug(p.metadata?.gender)].label.toLowerCase()}, livraison 2 à 4 jours ouvrés, retours sous 14 jours.`,
    path: productPath(p),
    images: (p.images ?? []).map((i) => i.url).slice(0, 1),
  })
}

export default async function ProductPage({ params }: P) {
  const { genre, category, handle } = await params
  const p = await getProduct(handle)
  if (!p) notFound()
  const canonical = productPath(p)
  if (canonical !== `/${genre}/${category}/${handle}`) permanentRedirect(canonical) // une seule URL par produit

  const variants: VariantLite[] = (p.variants ?? []).flatMap((v) => {
    const size = optionValue(v, "Taille"); const color = optionValue(v, "Couleur"); const price = v.calculated_price?.calculated_amount
    return size && color && typeof price === "number" ? [{ id: v.id, size, color, qty: v.inventory_quantity ?? 0, price }] : []
  })
  const g = GENRES[genre]
  const catLabel = CATEGORY_LABEL[category] ?? category
  const fit = typeof p.metadata?.fit_note === "string" ? p.metadata.fit_note : undefined
  const brand = typeof p.metadata?.brand === "string" ? p.metadata.brand : "—"
  const others = (await listProducts()).filter((o) => o.id !== p.id && o.metadata?.gender === p.metadata?.gender).slice(0, 4)
  const images = (p.images ?? []).map((i) => i.url)

  return (
    <>
      <JsonLd data={productJsonLd({
        name: p.title, description: p.description ?? p.title, images, brand, sku: p.variants?.[0]?.sku ?? p.id,
        priceEur: minPrice(p), inStock: variants.some((v) => v.qty > 0), url: `${SITE_URL}${canonical}`,
        // gtin / mpn : à renseigner depuis le fournisseur (champs vides = non exposés, jamais inventés)
      })} />
      <JsonLd data={breadcrumbJsonLd([
        { name: "Accueil", url: SITE_URL }, { name: g.label, url: `${SITE_URL}/${genre}` },
        { name: catLabel, url: `${SITE_URL}/${genre}/${category}` }, { name: p.title, url: `${SITE_URL}${canonical}` }])} />

      <nav aria-label="Fil d'Ariane" className="text-sm text-muted">
        <Link href="/" className="hover:text-accent">Accueil</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/${genre}`} className="hover:text-accent">{g.label}</Link> <span aria-hidden="true">›</span>{" "}
        <Link href={`/${genre}/${category}`} className="hover:text-accent">{catLabel}</Link> <span aria-hidden="true">›</span> <span className="text-ink">{p.title}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-[1fr_340px] lg:grid-cols-[1fr_420px]">
        <div className="grid grid-cols-2 gap-3">
          <div className="relative col-span-2 aspect-[4/5] overflow-hidden rounded-[12px]"><ProductImage src={images[0] ?? null} alt={p.title} priority sizes="(min-width:768px) 60vw, 100vw" /></div>
          {images.slice(1, 5).map((src, i) => <div key={src} className="relative aspect-[4/5] overflow-hidden rounded-[12px]"><ProductImage src={src} alt={`${p.title}, vue ${i + 2}`} sizes="30vw" /></div>)}
        </div>

        <div className="md:sticky md:top-6 md:self-start">
          <p className="text-xs uppercase tracking-[0.14em] text-muted">{p.subtitle}</p>
          <h1 className="mt-1 text-3xl font-bold">{p.title}</h1>
          <ProductForm variants={variants} fitNote={fit} />

          <div className="mt-8 divide-y divide-line rounded-[12px] border border-line bg-white">
            <details open className="p-4"><summary className="cursor-pointer font-medium">Description</summary>
              <p className="mt-3 text-sm text-muted">{p.description ?? "Description à rédiger."}</p></details>
            <details className="p-4"><summary className="cursor-pointer font-medium">Caractéristiques</summary>
              <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 text-sm"><dt className="text-muted">Marque</dt><dd>{brand}</dd><dt className="text-muted">Genre</dt><dd>{g.label}</dd><dt className="text-muted">Coupe</dt><dd>{fit ?? "—"}</dd></dl></details>
            <details className="p-4"><summary className="cursor-pointer font-medium">Livraison et retours</summary>
              <p className="mt-3 text-sm text-muted">Livraison en France sous 2 à 4 jours ouvrés. Vous disposez de 14 jours après réception pour vous rétracter : <Link href="/retractation" className="link">renoncer au contrat ici</Link>.</p></details>
          </div>
        </div>
      </div>

      <section aria-labelledby="avis" className="mt-16 border-t border-line pt-10">
        <h2 id="avis" className="text-2xl font-semibold">Avis clients</h2>
        <p className="mt-3 text-sm text-muted">Aucun avis pour le moment.</p>
      </section>

      {others.length > 0 && (
        <section aria-labelledby="similaires" className="mt-16">
          <h2 id="similaires" className="text-2xl font-semibold">Vous aimerez aussi</h2>
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{others.map((o) => <li key={o.id}><ProductCard c={toCard(o)} /></li>)}</ul>
        </section>)}
    </>
  )
}
