import Image from "next/image"
import Link from "next/link"
import { listProducts } from "@/lib/medusa"
import { GENRES, eur, longestDelivery, toCard, type Card } from "@/lib/catalog"
import { CATEGORY_LABEL } from "@/lib/content"
import { ProductCard } from "@/components/product-card"
import { SneakerArt, tint } from "@/components/sneaker-art"
import { FREE_SHIPPING_THRESHOLD, SITE_NAME, TAGLINE } from "@/lib/site"
import { JsonLd } from "@/components/json-ld"
import { organizationJsonLd, pageMeta } from "@/lib/seo"

// Photo réelle d'un produit pour les visuels de l'accueil ; jamais deux fois la même ; illustration à défaut.
function photoPicker(cards: Card[]) {
  const used = new Set<string>()
  return (match: (c: Card) => boolean) => {
    const c = cards.find((x) => x.image && !used.has(x.image) && match(x)) ?? cards.find((x) => x.image && match(x))
    if (c?.image) used.add(c.image)
    return c?.image ?? null
  }
}

export const revalidate = 300

export const metadata = pageMeta({
  title: `${SITE_NAME} – ${TAGLINE}`, absoluteTitle: true, path: "/",
  description: "Baskets réhaussantes pour homme : une semelle intérieure invisible pour gagner de +6 à +12 cm. Livraison en France, retours sous 14 jours.",
})

// Pleine largeur depuis l'intérieur de <main> (max 1200 px) ; body coupe le débordement horizontal.
const bleed = "mx-[calc(50%-50vw)]"
const GENRE = Object.keys(GENRES)[0]

const icon = { fill: "none", stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const

const steps = [
  { title: "Une réhausse cachée", text: "Une semelle réhaussante est intégrée à l'intérieur, sous le talon. Elle ne se voit ni de côté, ni quand vous retirez votre pied." },
  { title: "Vous choisissez la hauteur", text: "Selon le modèle, de +6 à +12 cm (hauteurs annoncées par le fabricant). Pour commencer, +6 cm est la plus facile à porter." },
  { title: "Une basket normale", text: "Silhouette classique, semelle extérieure aux proportions habituelles : on voit une basket de ville, pas une chaussure compensée." },
]

const faq = [
  { q: "Est-ce que ça se voit ?", a: "Non : la réhausse est à l'intérieur de la chaussure. De l'extérieur, la semelle a l'épaisseur d'une basket de ville. Seule la hauteur de la tige au talon est un peu plus haute que sur une basket classique." },
  { q: "Combien de centimètres vais-je gagner ?", a: "Quand le fabricant l'annonce, la hauteur est indiquée sur la fiche et se choisit avec le coloris : de +6 à +12 cm selon le modèle. Elle comprend la semelle intérieure et l'épaisseur de la semelle extérieure." },
  { q: "Est-ce confortable ?", a: "Jusqu'à +6 / +8 cm, la plupart des personnes s'y habituent en une journée. Au-delà, le pied est plus incliné : portez-les d'abord par périodes courtes. Ces modèles ne sont pas faits pour la course à pied." },
  { q: "Quelle pointure choisir ?", a: "La réhausse prend un peu de place à l'intérieur. Mesurez la longueur de votre pied en centimètres et suivez le guide des tailles plutôt que votre pointure habituelle." },
  { q: "Et si ça ne me va pas ?", a: "Vous avez 14 jours après réception pour changer d'avis, sans avoir à vous justifier. Le formulaire de rétractation est accessible en bas de chaque page, sans compte." },
]

/** Coupe d'une basket : la réhausse (en couleur) est logée sous le talon, la semelle extérieure reste fine. */
function LiftDiagram() {
  return (
    <svg viewBox="0 0 420 220" role="img" aria-labelledby="lift-title" className="w-full max-w-[520px]">
      <title id="lift-title">Coupe d'une basket réhaussante : semelle intérieure cachée sous le talon</title>
      <path d="M48 168 L48 86 C48 72 58 64 72 64 L132 64 C146 64 152 74 162 86 L214 116 C262 126 338 132 378 146 C394 152 396 168 380 168 Z" fill="#ffffff" stroke="#111111" strokeWidth="3" strokeLinejoin="round" />
      <path d="M40 168 L388 168 C396 168 400 174 398 182 C396 188 390 190 382 190 L48 190 C42 190 38 186 38 180 Z" fill="#111111" />
      <path d="M58 164 L58 130 C58 125 62 122 67 122 L140 126 L226 156 L226 164 Z" fill="var(--color-accent, #1f4fff)" />
      <path d="M22 164 L22 122" stroke="#111111" strokeWidth="2" markerStart="url(#a)" markerEnd="url(#a)" />
      <defs><marker id="a" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 Z" fill="#111111" /></marker></defs>
      <text x="66" y="110" fontSize="15" fontWeight="700" fill="#111111" textAnchor="start">+6 à +12 cm</text>
      <text x="140" y="210" fontSize="13" fill="#6b6b66" textAnchor="middle">réhausse intérieure</text>
      <text x="320" y="210" fontSize="13" fill="#6b6b66" textAnchor="middle">semelle extérieure classique</text>
    </svg>
  )
}

export default async function Home() {
  const products = await listProducts()
  const cards = products.map(toCard)
  const from = Math.min(...cards.map((c) => c.price).filter((p) => p > 0))
  const delivery = longestDelivery(products.map((p) => p.metadata))
  const pick = photoPicker(cards)
  const hero = pick((c) => c.handle.includes("cuir")) ?? pick(() => true)
  const cats = [...new Set(cards.map((c) => c.category).filter(Boolean))]
  const catPhotos = cats.map((cat) => pick((c) => c.category === cat))
  const reassurance = [
    { label: "Réhausse invisible", hint: "Cachée dans la chaussure", d: "M12 20V4M6 10l6-6 6 6M4 20h16" },
    { label: "Livraison en France", hint: `Suivie, ${delivery} jours ouvrés`, d: "M3 7h11v9H3zM14 10h4l3 3v3h-7zM7 19a2 2 0 1 0 0-.01M17 19a2 2 0 1 0 0-.01" },
    { label: "Retours sous 14 jours", hint: "Rétractation en ligne", d: "M4 9h11a5 5 0 0 1 0 10H9M4 9l4-4M4 9l4 4" },
    { label: "Paiement sécurisé", hint: "Aucune carte stockée", d: "M6 11V8a6 6 0 0 1 12 0v3M5 11h14v9H5zM12 15v2" },
  ]
  return (
    <>
      <JsonLd data={organizationJsonLd()} />

      {/* Ouverture : la promesse en grand, la photo du modèle phare à droite */}
      <section className={`${bleed} -mt-8 bg-[#15171d] text-white`}>
        <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-4 py-12 md:grid-cols-[1.15fr_1fr] md:py-20">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">{TAGLINE}</p>
            <h1 className="mt-4 font-display text-[2.9rem] font-bold uppercase leading-[0.92] tracking-[-0.02em] md:text-[5.2rem]">Quelques centimètres de plus.<br /><span className="text-[#8fa6ff]">Personne ne le saura.</span></h1>
            <p className="mt-6 max-w-md text-lg text-white/80">Des baskets au look parfaitement normal, avec une réhausse invisible intégrée à l'intérieur : de +6 à +12 cm selon le modèle.</p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={`/${GENRE}`} className="btn bg-white text-ink hover:bg-white/90">Voir les modèles</Link>
              {Number.isFinite(from) && <span className="text-sm font-semibold uppercase tracking-[0.14em] text-white/80">À partir de {eur(from)}</span>}
            </div>
          </div>
          <div className="relative aspect-square overflow-hidden bg-white/5">
            {hero
              ? <Image src={hero} alt="" fill priority sizes="(min-width:768px) 45vw, 100vw" className="object-cover" />
              : <SneakerArt color="#1f4fff" className="absolute left-1/2 top-1/2 w-[90%] -translate-x-1/2 -translate-y-1/2" />}
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

      <section aria-labelledby="principe" className="mt-16 grid items-center gap-10 md:mt-24 md:grid-cols-2">
        <div>
          <h2 id="principe" className="font-display text-4xl font-bold uppercase tracking-[-0.01em] md:text-5xl">Comment ça marche</h2>
          <ol className="mt-8 space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-display text-lg font-bold text-white">{i + 1}</span>
                <span><span className="block font-semibold">{s.title}</span><span className="mt-1 block text-muted">{s.text}</span></span>
              </li>))}
          </ol>
        </div>
        <div className="flex justify-center bg-white p-6 md:p-10"><LiftDiagram /></div>
      </section>

      {cards.length > 0 && (
        <section aria-labelledby="modeles" className={`${bleed} mt-20 md:mt-28`}>
          <div className="mx-auto mb-6 flex max-w-[1200px] items-end justify-between gap-4 px-4">
            <h2 id="modeles" className="font-display text-4xl font-bold uppercase tracking-[-0.01em] md:text-5xl">Les modèles</h2>
            <Link href={`/${GENRE}`} className="link text-sm font-semibold">Tout voir</Link>
          </div>
          <ul className="gallery snap-x snap-mandatory grid-flow-col auto-cols-[72%] overflow-x-auto sm:auto-cols-[42%] lg:grid-flow-row lg:grid-cols-4 lg:overflow-visible">
            {cards.slice(0, 8).map((c, i) => <li key={c.id} className="snap-start"><ProductCard c={c} priority={i < 2} /></li>)}
          </ul>
        </section>)}

      {cats.length > 1 && (
        <section aria-label="Catégories" className={`${bleed} mt-20 md:mt-28`}>
          <ul className="gallery sm:grid-cols-2">
            {cats.map((cat, i) => (
              <li key={cat}>
                <Link href={`/${GENRE}/${cat}`} className="group relative flex h-72 overflow-hidden p-5 md:h-[420px]" style={{ background: tint("#1f4fff", 0.12, "#f2f1ec") }}>
                  <span className="relative z-10 flex h-fit flex-col items-start gap-1.5">
                    <span className="inline-flex items-center gap-2 bg-white px-3 py-1.5 font-display text-lg font-bold uppercase">{CATEGORY_LABEL[cat] ?? cat}<span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span></span>
                    <span className="bg-white px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em]">{cards.filter((c) => c.category === cat).length} modèle{cards.filter((c) => c.category === cat).length > 1 ? "s" : ""}</span>
                  </span>
                  {catPhotos[i] && <Image src={catPhotos[i]!} alt="" fill sizes="(min-width:640px) 50vw, 100vw" className="object-cover transition-transform duration-700 group-hover:scale-105" />}
                </Link>
              </li>))}
          </ul>
        </section>)}

      <section aria-labelledby="faq" className="mx-auto mt-20 max-w-3xl md:mt-28">
        <h2 id="faq" className="font-display text-4xl font-bold uppercase tracking-[-0.01em] md:text-5xl">Questions fréquentes</h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faq.map((f) => (
            <details key={f.q} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">
                {f.q}<span aria-hidden="true" className="text-xl text-accent transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-muted">{f.a}</p>
            </details>))}
        </div>
      </section>

      <section className={`${bleed} relative mt-20 overflow-hidden bg-accent text-white md:mt-28`}>
        <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-14 md:grid-cols-[1.4fr_1fr] md:py-20">
          <div>
            <h2 className="font-display text-4xl font-bold uppercase leading-[0.95] tracking-[-0.01em] md:text-6xl">Zéro doute<br />sur la taille.</h2>
            <p className="mt-4 max-w-xl text-white/90">La réhausse prend un peu de place dans la chaussure : mesurez la longueur de votre pied et trouvez votre pointure en 30 secondes. Livraison offerte dès {FREE_SHIPPING_THRESHOLD} €.</p>
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
