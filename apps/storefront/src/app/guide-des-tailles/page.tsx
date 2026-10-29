import type { Metadata } from "next"
import { SizeCalculator } from "@/components/size-calculator"
import { pageMeta } from "@/lib/seo"

export const metadata: Metadata = pageMeta({
  title: "Guide des tailles : trouvez votre pointure en cm",
  description: "Mesurez votre pied en 3 étapes et trouvez votre pointure de baskets grâce à notre calculateur et au tableau de conversion cm, EU, UK, US.",
  path: "/guide-des-tailles",
})

export default function SizeGuidePage() {
  const steps = [["Sur une feuille", "Posez votre pied nu sur une feuille de papier, le talon contre un mur."], ["Tracez le contour", "Tracez un trait devant votre orteil le plus long, le stylo bien vertical."], ["Mesurez en cm", "Mesurez la distance entre le bord de la feuille (talon) et votre trait : c'est la longueur de votre pied."]]
  return (
    <article className="mx-auto max-w-3xl">
      <h1 className="text-4xl font-bold">Trouvez la taille parfaite.</h1>
      <p className="mt-3 text-muted">Évitez les retours inutiles : mesurez votre pied avec précision en 3 étapes.</p>
      <ol className="mt-8 grid gap-4 md:grid-cols-3">{steps.map(([t, d], i) => (
        <li key={t} className="card p-5"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink text-sm text-white">{i + 1}</span><h2 className="mt-3 text-lg font-semibold">{t}</h2><p className="mt-1 text-sm text-muted">{d}</p></li>))}</ol>
      <div className="mt-10"><SizeCalculator /></div>
      <p role="note" className="mt-6 text-sm text-muted">Valeurs indicatives. La coupe varie selon les modèles : consultez la note de coupe sur chaque fiche produit.</p>
    </article>
  )
}
