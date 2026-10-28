import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { getLastOrder } from "@/lib/cart-data"
import { eur } from "@/lib/catalog"

export const metadata: Metadata = { title: "Commande enregistrée", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function ConfirmationPage() {
  const order = await getLastOrder()
  if (!order) redirect("/")
  const a = order.shipping_address
  const ship = order.shipping_methods?.[0]
  return (
    <section className="mx-auto max-w-2xl">
      <div className="text-center">
        <p aria-hidden="true" className="text-5xl text-success">✓</p>
        <h1 className="mt-4 text-4xl font-bold">Merci pour votre commande !</h1>
        <p className="mt-3 text-muted">Votre commande <strong className="text-ink">n° {order.display_id}</strong> a bien été enregistrée.</p>
      </div>

      <div className="card mt-10 grid gap-8 p-6 md:grid-cols-2">
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Livraison</h2>
          <p className="mt-3 text-sm">{a?.first_name} {a?.last_name}<br />{a?.address_1}<br />{a?.postal_code} {a?.city}, France</p>
          <p className="mt-3 text-sm text-muted">Estimation : 2 à 4 jours ouvrés</p></div>
        <div><h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Récapitulatif</h2>
          <ul className="mt-3 space-y-1 text-sm">{order.items.map((i) => <li key={i.id} className="flex justify-between gap-4"><span>{i.title} ({i.variant_title}) × {i.quantity}</span><span>{eur(i.total)}</span></li>)}
            {ship && <li className="flex justify-between"><span>{ship.name}</span><span>{ship.amount === 0 ? "Offerte" : eur(ship.amount)}</span></li>}</ul>
          <p className="mt-3 flex justify-between border-t border-line pt-3 font-semibold"><span>Total payé</span><span>{eur(order.total)}</span></p>
          <p className="mt-1 text-right text-xs text-muted">dont TVA : {eur(order.tax_total)}</p></div>
      </div>

      <div className="mt-10 border-t border-line pt-6 text-sm text-muted">
        <h2 className="text-xs font-semibold uppercase tracking-[0.14em]">Informations importantes</h2>
        <p className="mt-3">Vous disposez de 14 jours à compter de la réception de votre colis pour vous rétracter, sans avoir à vous justifier : <Link href="/retractation" className="link">renoncer au contrat ici</Link> (munissez-vous de votre numéro de commande : {order.display_id}).</p>
      </div>
      <p className="mt-8 text-center"><Link href="/" className="btn-secondary">Retour à la boutique</Link></p>
    </section>
  )
}
