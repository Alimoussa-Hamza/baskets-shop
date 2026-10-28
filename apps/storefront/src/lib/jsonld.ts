// JSON-LD Product + Offer (+ AggregateRating si avis approuvés) + BreadcrumbList.
export type ProductLd = {
  name: string; description: string; images: string[]; brand: string; sku: string
  gtin?: string; mpn?: string; priceEur: number; inStock: boolean; url: string
  rating?: { value: number; count: number }
}

export function productJsonLd(p: ProductLd) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images,
    sku: p.sku,
    ...(p.gtin ? { gtin: p.gtin } : {}),
    ...(p.mpn ? { mpn: p.mpn } : {}),
    brand: { "@type": "Brand", name: p.brand },
    offers: {
      "@type": "Offer",
      url: p.url,
      priceCurrency: "EUR",
      price: p.priceEur.toFixed(2),
      availability: p.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    // N exposer AggregateRating que pour de vrais avis approuvés (règle : avis indiqués vérifiés ou non)
    ...(p.rating && p.rating.count > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: p.rating.value, reviewCount: p.rating.count } }
      : {}),
  }
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, item: it.url })),
  }
}
