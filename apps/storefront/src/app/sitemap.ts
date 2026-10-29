import type { MetadataRoute } from "next"
import { listProducts } from "@/lib/medusa"
import { GENRES, productPath } from "@/lib/catalog"
import { SITE_URL } from "@/lib/site"

export const revalidate = 3600

// Pages indexables uniquement : accueil, genres, catégories ayant des produits, fiches produit, guide des tailles.
// Les pages légales (brouillons, noindex), panier et commande n'y figurent pas.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await listProducts()
  const paths = products.map(productPath)
  const categories = [...new Set(paths.map((p) => p.split("/").slice(0, 3).join("/")))]
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...Object.keys(GENRES).map((g) => ({ url: `${SITE_URL}/${g}`, changeFrequency: "daily" as const, priority: 0.9 })),
    ...categories.map((c) => ({ url: `${SITE_URL}${c}`, changeFrequency: "daily" as const, priority: 0.8 })),
    ...paths.map((p) => ({ url: `${SITE_URL}${p}`, changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: `${SITE_URL}/guide-des-tailles`, changeFrequency: "monthly", priority: 0.6 },
  ]
}
