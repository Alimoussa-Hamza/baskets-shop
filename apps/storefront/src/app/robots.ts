import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panier", "/commande", "/compte", "/*?*sort=", "/*?*filter="] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
