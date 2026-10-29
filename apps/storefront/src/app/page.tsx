import Link from "next/link"
import { listProducts } from "@/lib/medusa"
import { GENRES, eur, toCard } from "@/lib/catalog"
import { NewArrivals } from "@/components/new-arrivals"
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
  { label: "Rétro", hint: "Les classiques revisités", href: "/baskets-homme/retro", color: "#c8332b" },
  { label: "Skate", hint: "Semelle plate, grip, style", href: "/baskets-homme/skate", color: "#2f6b4f" },
  { label: "Femme · Rétro", hint: "Courts et lignes vintage", href: "/baskets-femme/retro", color: "#e7a3b5" },
]

// Les deux univers en écran partagé (référence : Axel Arigato), chacun avec sa couleur d'ambiance.
const universes = [
  { slug: "baskets-femme", label: "Femme", hint: "Urbaines, montantes, essentiels", bg: "#efe6d8", fg: "text-ink", sneaker: "#ffffff", chip: "bg-white text-ink" },
  { slug: "baskets-homme", label: "Homme", hint: "Running, urbaines", bg: "#15171d", fg: "text-white", sneaker: "#1f4fff", chip: "bg-white text-ink" },
]

export default async function Home() {
  const products = await listProducts()
  const from = Math.min(...products.map(toCard).map((c) => c.price).filter((p) => p > 0))
  const tabs = Object.entries(GENRES).map(([slug, g]) => ({
    key: slug, label: g.label.replace("Baskets ", "").replace(/^./, (c) => c.toUpperCase()), href: `/${slug}`,
    cards: products.filter((p) => p.metadata?.gender === g.gender).slice(0, 4).map(toCard),
  })).filter((t) => t.cards.length > 0)
  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      {/* Ouverture éditoriale : titre en grand, promesse à droite */}
      <section className="-mt-8 grid gap-6 pb-10 pt-12 md:grid-cols-[1.4fr_1fr] md:items-end md:pt-16">
        <h1 className="font-display text-[3.2rem] font-bold uppercase leading-[0.92] tracking-[-0.02em] md:text-[6.5rem]">Marchez avec<br />l'élite.</h1>
        <div className="md:pb-3">
          <p className="max-w-sm text-lg text-muted">Une sélection de baskets pensée pour la ville et le mouvement. Confort absolu et design intemporel.</p>
          {Number.isFinite(from) && <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em]">À partir de {eur(from)}</p>}
        </div>
      </section>

      <section aria-label="Univers" className={`${bleed} grid md:grid-cols-2`}>
        {universes.map((u, i) => (
          <Link key={u.slug} href={`/${u.slug}`} className={`group relative flex h-[62vh] min-h-[380px] flex-col justify-between overflow-hidden p-6 md:h-[78vh] md:p-8 ${u.fg}`} style={{ background: u.bg }}>
            <span className="relative z-10">
              <span className="block font-display text-5xl font-bold uppercase tracking-[-0.02em] md:text-7xl">{u.label}</span>
              <span className="mt-2 block text-sm opacity-75">{u.hint}</span>
            </span>
            <SneakerArt color={u.sneaker} className={`absolute left-1/2 top-1/2 w-[92%] max-w-[640px] -translate-x-1/2 -translate-y-[40%] transition-transform duration-700 group-hover:scale-[1.04] ${i === 0 ? "-rotate-[8deg]" : "rotate-[8deg] -scale-x-100 group-hover:-scale-x-[1.04]"}`} />
            <span className={`relative z-10 inline-flex w-fit items-center gap-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.16em] ${u.chip}`}>
              Acheter {u.label.toLowerCase()} <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>))}
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

      {tabs.length > 0 && (
        <section aria-labelledby="nouveautes" className={`${bleed} mt-16 md:mt-24`}>
          <h2 id="nouveautes" className="mx-auto mb-6 max-w-[1200px] px-4 font-display text-4xl font-bold uppercase tracking-[-0.01em] md:text-5xl">Nouveautés</h2>
          <NewArrivals tabs={tabs} />
        </section>)}

      <section aria-labelledby="cats" className={`${bleed} mt-20 md:mt-28`}>
        <h2 id="cats" className="mx-auto mb-6 max-w-[1200px] px-4 font-display text-4xl font-bold uppercase tracking-[-0.01em] md:text-5xl">Univers</h2>
        <ul className="gallery sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <li key={c.href}>
              <Link href={c.href} className="group relative flex h-72 overflow-hidden p-5 md:h-[440px]" style={{ background: tint(c.color, 0.18, "#f2f1ec") }}>
                {/* Étiquette posée sur le visuel (référence : Sneakersnstuff) */}
                <span className="relative z-10 flex h-fit flex-col items-start gap-1.5">
                  <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 font-display text-lg font-bold uppercase">{c.label}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                  <span className="bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">{c.hint}</span>
                </span>
                <SneakerArt color={c.color} className="absolute -bottom-6 -right-10 w-[96%] -rotate-12 transition-transform duration-700 group-hover:-rotate-6 group-hover:scale-105" />
              </Link>
            </li>))}
        </ul>
      </section>

      <section className={`${bleed} relative mt-20 overflow-hidden bg-accent text-white md:mt-28`}>
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr] md:py-20">
          <div>
            <h2 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.01em] md:text-6xl">Zéro doute<br />sur la taille.</h2>
            <p className="mt-4 max-w-xl text-white/90">Mesurez la longueur de votre pied et trouvez votre pointure en 30 secondes. Livraison offerte dès {FREE_SHIPPING_THRESHOLD} €.</p>
            <Link href="/guide-des-tailles" className="btn mt-7 bg-white text-accent hover:bg-white/90">Calculer ma taille</Link>
          </div>
          <div aria-hidden="true" className="bg-white p-6 text-ink shadow-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Exemple</p>
            <div className="mt-3 flex items-baseline justify-between"><span className="text-sm text-muted">Longueur du pied</span><span className="font-display text-2xl font-semibold">27,5 cm</span></div>
            <div className="mt-3 h-3 bg-paper"><div className="h-3 w-[72%] bg-accent" /></div>
            <div className="mt-4 flex items-baseline justify-between border-t border-line pt-4"><span className="text-sm text-muted">Pointure conseillée</span><span className="font-display text-4xl font-bold text-accent">44</span></div>
          </div>
        </div>
      </section>
    </>
  )
}
