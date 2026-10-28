import Link from "next/link"
import { SITE_NAME, FREE_SHIPPING_THRESHOLD } from "@/lib/site"
import { eur } from "@/lib/catalog"
import { CartLink } from "./cart-link"

export function Header() {
  return (
    <header className="border-b border-line bg-paper">
      <p className="bg-ink px-4 py-2 text-center text-xs font-medium uppercase tracking-[0.12em] text-white">
        Livraison offerte dès {eur(FREE_SHIPPING_THRESHOLD).replace(",00", "")} · Retours sous 14 jours
      </p>
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <nav aria-label="Principal" className="flex items-center gap-6 text-sm font-medium uppercase tracking-wide">
          <Link href="/baskets-femme" className="py-3 hover:text-accent">Femme</Link>
          <Link href="/baskets-homme" className="py-3 hover:text-accent">Homme</Link>
        </nav>
        <Link href="/" className="font-display text-2xl font-bold tracking-tight" aria-label={`${SITE_NAME}, accueil`}>
          {SITE_NAME}<span className="text-accent">.</span>
        </Link>
        <div className="flex items-center"><CartLink /></div>
      </div>
    </header>
  )
}
