import type { Metadata } from "next"
import { SITE_NAME, SITE_URL } from "./site"

const DEFAULT_IMAGE = { url: "/opengraph-image", width: 1200, height: 630, alt: `${SITE_NAME} – Baskets homme et femme` }

// Next fusionne les métadonnées de façon superficielle : un openGraph de page remplace entièrement celui du layout.
// Chaque page indexable passe donc par ce socle commun (canonical, Open Graph, Twitter) pour ne rien perdre au partage.
export function pageMeta(p: { title: string; description: string; path: string; images?: string[]; absoluteTitle?: boolean }): Metadata {
  const fullTitle = p.absoluteTitle ? p.title : `${p.title} | ${SITE_NAME}`
  // Sans photo : image générée par app/opengraph-image.tsx (non héritée dès qu'une page définit son openGraph).
  const images = p.images?.length ? p.images.map((url) => ({ url })) : [DEFAULT_IMAGE]
  return {
    title: p.absoluteTitle ? { absolute: p.title } : p.title,
    description: p.description,
    alternates: { canonical: p.path },
    openGraph: { type: "website", locale: "fr_FR", siteName: SITE_NAME, url: p.path, title: fullTitle, description: p.description, images },
    twitter: { card: "summary_large_image", title: fullTitle, description: p.description, images: images.map((i) => i.url) },
  }
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      // Organization sans adresse ni SIRET : à compléter après immatriculation (jamais de données inventées).
      { "@type": "Organization", "@id": `${SITE_URL}/#organization`, name: SITE_NAME, url: SITE_URL },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website`, name: SITE_NAME, url: SITE_URL, inLanguage: "fr-FR", publisher: { "@id": `${SITE_URL}/#organization` } },
    ],
  }
}
