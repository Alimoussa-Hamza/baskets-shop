import type { Metadata } from "next"
import "./globals.css"
import { SITE_NAME, SITE_URL } from "@/lib/site"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { CookieBanner } from "@/components/cookie-banner"

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} – Baskets homme et femme`, template: `%s | ${SITE_NAME}` },
  description: "Baskets homme et femme. Guide des tailles en cm, livraison en France, retours sous 14 jours.",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>
        <a href="#contenu" className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-[60] focus:rounded focus:bg-white focus:p-3">Aller au contenu</a>
        <Header />
        <main id="contenu" className="mx-auto min-h-[60vh] max-w-[1200px] px-4 py-8">{children}</main>
        <Footer />
        <CookieBanner />
      </body>
    </html>
  )
}
