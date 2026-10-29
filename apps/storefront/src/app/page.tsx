import Link from "next/link"
import { listProducts } from "@/lib/medusa"
import { toCard } from "@/lib/catalog"
import { ProductCard } from "@/components/product-card"
import { FREE_SHIPPING_THRESHOLD, SITE_NAME } from "@/lib/site"
import { JsonLd } from "@/components/json-ld"
import { organizationJsonLd, pageMeta } from "@/lib/seo"

export const revalidate = 300

export const metadata = pageMeta({
  title: `${SITE_NAME} – Baskets homme et femme`, absoluteTitle: true, path: "/",
  description: "Baskets homme et femme. Guide des tailles en cm, livraison en France, retours sous 14 jours.",
})

export default async function Home() {
  const cards = (await listProducts()).slice(0, 4).map(toCard)
  const reassurance = ["Livraison en France", "Retours sous 14 jours", "Paiement sécurisé", "Guide des tailles en cm"]
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <section className="-mx-4 -mt-8 bg-ink px-4 py-20 text-white md:py-28">
        <div className="mx-auto max-w-[1200px]">
          <h1 className="max-w-2xl text-5xl font-bold leading-tight md:text-6xl">Marchez avec l'élite.</h1>
          <p className="mt-5 max-w-lg text-lg text-white/80">Une sélection de baskets pensée pour la ville et le mouvement. Confort absolu et design intemporel.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/baskets-femme" className="btn-primary">Baskets femme</Link>
            <Link href="/baskets-homme" className="btn bg-white text-ink hover:bg-white/90">Baskets homme</Link>
          </div>
        </div>
      </section>

      <ul className="-mx-4 grid grid-cols-2 gap-y-3 border-b border-line bg-white px-4 py-4 text-sm font-medium md:grid-cols-4 md:text-center">
        {reassurance.map((r) => <li key={r}>{r}</li>)}
      </ul>

      {cards.length > 0 && (
        <section aria-labelledby="nouveautes" className="mt-16">
          <div className="flex items-end justify-between"><h2 id="nouveautes" className="text-3xl font-semibold">Nos nouveautés</h2><Link href="/baskets-femme" className="link text-sm">Tout voir</Link></div>
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map((c, i) => <li key={c.id}><ProductCard c={c} priority={i < 2} /></li>)}</ul>
        </section>)}

      <section aria-labelledby="cats" className="mt-20">
        <h2 id="cats" className="text-3xl font-semibold">Parcourez nos catégories</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {[["Running", "/baskets-homme/running"], ["Urbaines", "/baskets-femme/urbaines"], ["Montantes", "/baskets-femme/montantes"]].map(([label, href]) => (
            <li key={href}><Link href={href} className="flex h-24 items-end rounded-[12px] bg-[#ececE6] p-5 text-xl font-semibold hover:bg-[#e2e2db] md:h-40">{label}</Link></li>))}
        </ul>
      </section>

      <section className="mt-20 rounded-[12px] bg-accent p-8 text-white md:p-12">
        <h2 className="text-3xl font-semibold">Zéro doute sur la taille.</h2>
        <p className="mt-3 max-w-xl text-white/90">Mesurez la longueur de votre pied et trouvez votre pointure. Livraison offerte dès {FREE_SHIPPING_THRESHOLD} €.</p>
        <Link href="/guide-des-tailles" className="btn mt-6 bg-white text-accent hover:bg-white/90">Calculer ma taille</Link>
      </section>
    </>
  )
}
