import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// À alimenter depuis Medusa (catégories + produits) à l étape 4.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL, changeFrequency: "daily", priority: 1 }]
}
