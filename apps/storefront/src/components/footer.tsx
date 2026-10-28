import Link from "next/link"
import { SITE_NAME } from "@/lib/site"
import { CookieSettingsButton } from "./cookie-banner"

export function Footer() {
  const col = "space-y-2 text-sm"
  const h = "mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-ink"
  return (
    <footer className="mt-24 border-t border-line bg-white">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-12 md:grid-cols-4">
        <div>
          <p className="font-display text-2xl font-bold">{SITE_NAME}<span className="text-accent">.</span></p>
          <p className="mt-3 max-w-xs text-sm text-muted">Baskets homme et femme. Livraison en France.</p>
        </div>
        <nav aria-label="Boutique"><h2 className={h}>Boutique</h2>
          <ul className={col}>
            <li><Link href="/baskets-femme" className="hover:text-accent">Baskets femme</Link></li>
            <li><Link href="/baskets-homme" className="hover:text-accent">Baskets homme</Link></li>
            <li><Link href="/guide-des-tailles" className="hover:text-accent">Guide des tailles</Link></li>
          </ul></nav>
        <nav aria-label="Aide"><h2 className={h}>Aide</h2>
          <ul className={col}>
            <li><Link href="/livraison-et-retours" className="hover:text-accent">Livraison et retours</Link></li>
            {/* Obligation : fonctionnalité de rétractation visible en permanence, sans compte */}
            <li><Link href="/retractation" className="link font-medium">Renoncer au contrat ici (rétractation)</Link></li>
          </ul></nav>
        <nav aria-label="Informations légales"><h2 className={h}>Légal</h2>
          <ul className={col}>
            <li><Link href="/mentions-legales" className="hover:text-accent">Mentions légales</Link></li>
            <li><Link href="/cgv" className="hover:text-accent">CGV</Link></li>
            <li><Link href="/confidentialite" className="hover:text-accent">Confidentialité</Link></li>
            <li><Link href="/cookies" className="hover:text-accent">Cookies</Link></li>
            <li><Link href="/mediateur" className="hover:text-accent">Médiateur</Link></li>
            <li><CookieSettingsButton /></li>
          </ul></nav>
      </div>
      <p className="border-t border-line px-4 py-5 text-center text-xs text-muted">© {new Date().getFullYear()} {SITE_NAME}. Tous droits réservés.</p>
    </footer>
  )
}
