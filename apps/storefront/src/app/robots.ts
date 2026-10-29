import type { MetadataRoute } from "next"
import { SITE_URL } from "@/lib/site"

// Lu à chaque requête : STAGING_PASSWORD est défini au démarrage du serveur, pas au build
export const dynamic = "force-dynamic"

export default function robots(): MetadataRoute.Robots {
  // Environnement de test (staging) : aucun robot, même si l'accès par mot de passe était désactivé par erreur
  if (process.env.STAGING_PASSWORD) return { rules: [{ userAgent: "*", disallow: "/" }] }
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/panier", "/commande", "/compte", "/*?*sort=", "/*?*filter="] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
