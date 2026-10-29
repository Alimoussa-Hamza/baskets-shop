import Link from "next/link"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/site"

// Bandeau d'aide sous les listings : guide des tailles + garanties de service (aucun chiffre inventé).
export function HelpStrip() {
  return (
    <section className="mt-16 grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]" aria-label="Aide à l'achat">
      <div className="relative overflow-hidden rounded-[16px] bg-accent p-7 text-white">
        <div aria-hidden="true" className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10" />
        <h2 className="relative text-2xl font-semibold">Un doute sur la taille ?</h2>
        <p className="relative mt-2 max-w-sm text-white/90">Mesurez votre pied en cm et trouvez votre pointure en 30 secondes.</p>
        <Link href="/guide-des-tailles" className="btn relative mt-5 bg-white text-accent hover:bg-white/90">Calculer ma taille</Link>
      </div>
      <div className="rounded-[16px] border border-line bg-white p-7">
        <h2 className="text-lg font-semibold">Livraison</h2>
        <p className="mt-2 text-sm text-muted">Livraison en France, offerte dès {FREE_SHIPPING_THRESHOLD} € d'achat.</p>
        <Link href="/livraison-et-retours" className="link mt-4 inline-block text-sm">Délais et tarifs</Link>
      </div>
      <div className="rounded-[16px] border border-line bg-white p-7">
        <h2 className="text-lg font-semibold">Retours</h2>
        <p className="mt-2 text-sm text-muted">14 jours pour changer d'avis, avec rétractation en ligne sans compte.</p>
        <Link href="/retractation" className="link mt-4 inline-block text-sm">Renoncer au contrat ici</Link>
      </div>
    </section>
  )
}
