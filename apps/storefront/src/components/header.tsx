import Link from "next/link"
import { SITE_NAME, FREE_SHIPPING_THRESHOLD } from "@/lib/site"
import { eur } from "@/lib/catalog"
import { CartLink } from "./cart-link"

const navLink = "relative py-3 after:absolute after:inset-x-0 after:bottom-2 after:h-0.5 after:origin-left after:scale-x-0 after:bg-accent after:transition-transform hover:after:scale-x-100"

export function Header() {
  return (
    <>
      <p className="bg-ink px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.12em] text-white">
        Livraison offerte dès {eur(FREE_SHIPPING_THRESHOLD).replace(",00", "")} · Retours sous 14 jours
      </p>
      {/* Barre collante : reste accessible au défilement, fond translucide */}
      <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
          <nav aria-label="Principal" className="flex items-center gap-6 text-sm font-medium uppercase tracking-wide">
            <Link href="/baskets-femme" className={navLink}>Femme</Link>
            <Link href="/baskets-homme" className={navLink}>Homme</Link>
          </nav>
          <Link href="/" className="font-display text-2xl font-bold tracking-tight" aria-label={`${SITE_NAME}, accueil`}>
            {SITE_NAME}<span className="text-accent">.</span>
          </Link>
          <div className="flex items-center"><CartLink /></div>
        </div>
      </header>
    </>
  )
}
