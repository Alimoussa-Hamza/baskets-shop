import Link from "next/link"
import { listProducts } from "@/lib/medusa"
import { eur, toCard } from "@/lib/catalog"
import { ProductCard } from "@/components/product-card"
import { SneakerArt, tint } from "@/components/sneaker-art"
import { FREE_SHIPPING_THRESHOLD, SITE_NAME } from "@/lib/site"
import { JsonLd } from "@/components/json-ld"
import { organizationJsonLd, pageMeta } from "@/lib/seo"

export const revalidate = 300

export const metadata = pageMeta({
  title: `${SITE_NAME} – Baskets homme et femme`, absoluteTitle: true, path: "/",
  description: "Baskets homme et femme. Guide des tailles en cm, livraison en France, retours sous 14 jours.",
})

// Pleine largeur depuis l'intérieur de <main> (max 1200 px) ; body coupe le débordement horizontal.
const bleed = "mx-[calc(50%-50vw)]"

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const
const reassurance = [
  { label: "Livraison en France", hint: `Offerte dès ${FREE_SHIPPING_THRESHOLD} €`, d: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01" },
  { label: "Retours sous 14 jours", hint: "Rétractation en ligne", d: "M4 9h11a5 5 0 0 1 0 10H9M4 9l4-4M4 9l4 4" },
  { label: "Paiement sécurisé", hint: "Aucune carte stockée", d: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5zM12 15v2" },
  { label: "Guide des tailles en cm", hint: "Votre pointure exacte", d: "M3 15 15 3l6 6L9 21zM7 11l2 2M10 8l2 2M13 5l2 2" },
]

const categories = [
  { label: "Running", hint: "Amorti et légèreté", href: "/baskets-homme/running", color: "#1f4fff" },
  { label: "Urbaines", hint: "Le quotidien, en style", href: "/baskets-femme/urbaines", color: "#d9cdb8" },
  { label: "Montantes", hint: "Maintien et caractère", href: "/baskets-femme/montantes", color: "#111111" },
]

export default async function Home() {
  const products = await listProducts()
  const cards = products.slice(0, 4).map(toCard)
  const from = Math.min(...products.map(toCard).map((c) => c.price).filter((p) => p > 0))
  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      <section className={`${bleed} relative -mt-8 overflow-hidden bg-ink text-white`}>
        <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-accent/35 blur-3xl md:right-[5%]" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-6 px-4 pb-14 pt-12 md:grid-cols-[1.05fr_1fr] md:gap-10 md:py-24">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/60">Baskets homme &amp; femme</p>
            <h1 className="mt-4 max-w-xl text-5xl font-bold leading-[1.05] md:text-7xl">Marchez avec l'élite.</h1>
            <p className="mt-6 max-w-md text-lg text-white/75">Une sélection de baskets pensée pour la ville et le mouvement. Confort absolu et design intemporel.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/baskets-femme" className="btn-primary">Baskets femme</Link>
              <Link href="/baskets-homme" className="btn bg-white text-ink hover:bg-white/90">Baskets homme</Link>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[520px]">
            <SneakerArt color="#f4f3ee" className="relative w-full -rotate-6 drop-shadow-[0_30px_40px_rgba(0,0,0,0.45)]" />
            {Number.isFinite(from) && (
              <p className="absolute bottom-[8%] right-[4%] rounded-full bg-white px-4 py-2 text-sm font-semibold text-ink shadow-lg">Dès {eur(from)}</p>)}
          </div>
        </div>
      </section>

      <div className={`${bleed} border-b border-line bg-white`}>
        <ul className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-4 gap-y-5 px-4 py-6 md:grid-cols-4">
          {reassurance.map((r) => (
            <li key={r.label} className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-paper text-accent">
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" {...icon}><path d={r.d} /></svg>
              </span>
              <span className="text-sm leading-tight"><span className="block font-semibold">{r.label}</span><span className="hidden text-muted sm:inline">{r.hint}</span></span>
            </li>))}
        </ul>
      </div>

      {cards.length > 0 && (
        <section aria-labelledby="nouveautes" className="mt-16 md:mt-20">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Sélection</p><h2 id="nouveautes" className="mt-2 text-3xl font-semibold md:text-4xl">Nos nouveautés</h2></div>
            <Link href="/baskets-femme" className="group inline-flex items-center gap-1 text-sm font-medium hover:text-accent">Tout voir <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></Link>
          </div>
          <ul className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">{cards.map((c, i) => <li key={c.id}><ProductCard c={c} priority={i < 2} /></li>)}</ul>
        </section>)}

      <section aria-labelledby="cats" className="mt-20 md:mt-24">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Univers</p>
        <h2 id="cats" className="mt-2 text-3xl font-semibold md:text-4xl">Parcourez nos catégories</h2>
        <ul className="mt-8 grid gap-4 md:grid-cols-3">
          {categories.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group relative flex h-44 overflow-hidden rounded-[16px] p-6 md:h-64" style={{ background: tint(c.color, 0.16) }}>
                <span className="relative z-10 flex flex-col">
                  <span className="font-display text-2xl font-semibold">{c.label}</span>
                  <span className="mt-1 text-sm text-muted">{c.hint}</span>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium">Découvrir <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                </span>
                <SneakerArt color={c.color} className="absolute -bottom-4 -right-8 w-[78%] -rotate-12 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105" />
              </Link>
            </li>))}
        </ul>
      </section>

      <section className="relative mt-20 overflow-hidden rounded-[16px] bg-accent text-white md:mt-24">
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" />
        <div className="relative grid items-center gap-8 p-8 md:grid-cols-[1.4fr_1fr] md:p-14">
          <div>
            <h2 className="text-3xl font-semibold md:text-4xl">Zéro doute sur la taille.</h2>
            <p className="mt-3 max-w-xl text-white/90">Mesurez la longueur de votre pied et trouvez votre pointure en 30 secondes. Livraison offerte dès {FREE_SHIPPING_THRESHOLD} €.</p>
            <Link href="/guide-des-tailles" className="btn mt-7 bg-white text-accent hover:bg-white/90">Calculer ma taille</Link>
          </div>
          <div aria-hidden="true" className="rounded-[12px] bg-white p-5 text-ink shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Exemple</p>
            <div className="mt-3 flex items-baseline justify-between"><span className="text-sm text-muted">Longueur du pied</span><span className="font-display text-2xl font-semibold">27,5 cm</span></div>
            <div className="mt-3 h-3 rounded-full bg-paper"><div className="h-3 w-[72%] rounded-full bg-accent" /></div>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="text-sm text-muted">Pointure conseillée</span><span className="font-display text-3xl font-bold text-accent">44</span></div>
          </div>
        </div>
      </section>
    </>
  )
}
