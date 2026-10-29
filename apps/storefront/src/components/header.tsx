import Link from "next/link"
import { SITE_NAME, FREE_SHIPPING_THRESHOLD } from "@/lib/site"
import { GENRES, eur, productPath } from "@/lib/catalog"
import { CATEGORY_LABEL } from "@/lib/content"
import { listProducts } from "@/lib/medusa"
import { CartLink } from "./cart-link"
import { MobileMenu, type MenuSection } from "./mobile-menu"

const navLink = "relative py-3 after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"

// Rubriques du menu mobile : genres, puis catégories ayant au moins un produit (même source que le sitemap).
async function menuSections(): Promise<MenuSection[]> {
  let paths: string[] = []
  try { paths = (await listProducts()).map(productPath) } catch { /* backend indisponible : genres seuls */ }
  return Object.entries(GENRES).map(([slug, g]) => ({
    label: g.label.replace("Baskets ", "").replace(/^./, (c) => c.toUpperCase()),
    href: `/${slug}`,
    links: [...new Set(paths.filter((p) => p.startsWith(`/${slug}/`)).map((p) => p.split("/")[2]))]
      .map((c) => ({ label: CATEGORY_LABEL[c] ?? c, href: `/${slug}/${c}` })),
  }))
}

export async function Header() {
  const sections = await menuSections()
  const messages = [`Livraison offerte dès ${eur(FREE_SHIPPING_THRESHOLD).replace(",00", "")}`, "Retours sous 14 jours", "Guide des tailles en cm", "Paiement sécurisé"]
  return (
    <>
      {/* Bandeau défilant (référence : Axel Arigato) ; contenu doublé pour une boucle continue, lu une seule fois */}
      <div className="overflow-hidden bg-[#e7ecff] py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink">
        <p className="sr-only">{messages.join(" · ")}</p>
        <div aria-hidden="true" className="animate-marquee flex w-max">
          {[0, 1].map((k) => (
            <span key={k} className="flex shrink-0">
              {[...messages, ...messages].map((m, i) => <span key={i} className="flex items-center px-8"><span className="mr-8 text-accent">●</span>{m}</span>)}
            </span>))}
        </div>
      </div>
      {/* Barre collante : reste accessible au défilement, fond translucide */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto grid h-16 max-w-[1200px] grid-cols-[1fr_auto_1fr] items-center px-4">
          <div className="flex items-center">
            <MobileMenu sections={sections} />
            <nav aria-label="Principal" className="hidden items-center gap-6 text-sm font-medium uppercase tracking-wide md:flex">
              <Link href="/baskets-femme" className={navLink}>Femme</Link>
              <Link href="/baskets-homme" className={navLink}>Homme</Link>
            </nav>
          </div>
          <Link href="/" className="font-display text-2xl font-bold tracking-tight" aria-label={`${SITE_NAME}, accueil`}>
            {SITE_NAME}<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center justify-end"><CartLink /></div>
        </div>
      </header>
    </>
  )
}
