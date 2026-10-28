import type { Metadata } from "next"
import Link from "next/link"
import { getCart, getShippingEstimate } from "@/lib/cart-data"
import { eur } from "@/lib/catalog"
import { FREE_SHIPPING_THRESHOLD } from "@/lib/site"
import { CartLines } from "@/components/cart-lines"

export const metadata: Metadata = { title: "Votre panier", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function CartPage() {
  const cart = await getCart()
  if (!cart || cart.items.length === 0) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-3xl font-bold">Votre panier est vide</h1>
        <p className="mt-3 text-muted">Découvrez nos baskets pour femme et pour homme.</p>
        <div className="mt-6 flex justify-center gap-3"><Link href="/baskets-femme" className="btn-primary">Baskets femme</Link><Link href="/baskets-homme" className="btn-secondary">Baskets homme</Link></div>
      </section>)
  }
  const chosen = cart.shipping_methods?.[0]
  const estimate = chosen ? chosen.amount : await getShippingEstimate(cart.id)
  const shipping = estimate ?? 0
  const total = cart.item_total + (chosen ? 0 : shipping) - (cart.discount_total ?? 0) // item_total est TTC ; la livraison choisie est déjà dans cart.total
  const grand = chosen ? cart.total : total
  const missing = Math.max(0, FREE_SHIPPING_THRESHOLD - cart.item_total)
  const vat = chosen ? cart.tax_total : cart.tax_total + (shipping - shipping / 1.2)

  return (
    <>
      <h1 className="text-4xl font-bold">Votre panier</h1>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="card mb-6 p-5">
            <p className="text-sm">{missing > 0 ? <>Plus que <strong>{eur(missing)}</strong> pour la livraison offerte</> : <strong>Livraison offerte</strong>}</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-line" role="progressbar" aria-valuemin={0} aria-valuemax={FREE_SHIPPING_THRESHOLD} aria-valuenow={Math.min(cart.item_total, FREE_SHIPPING_THRESHOLD)} aria-label="Progression vers la livraison offerte">
              <div className="h-full bg-accent" style={{ width: `${Math.min(100, (cart.item_total / FREE_SHIPPING_THRESHOLD) * 100)}%` }} /></div>
          </div>
          <CartLines items={cart.items} />
        </div>
        <aside className="card h-fit p-6" aria-label="Récapitulatif">
          <h2 className="text-xl font-semibold">Récapitulatif</h2>
          <dl className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd>{eur(cart.item_total)}</dd></div>
            {(cart.discount_total ?? 0) > 0 && <div className="flex justify-between"><dt className="text-muted">Réduction</dt><dd>−{eur(cart.discount_total!)}</dd></div>}
            <div className="flex justify-between"><dt className="text-muted">Livraison {chosen ? "" : "estimée"}</dt><dd>{estimate === null ? "À l'étape suivante" : shipping === 0 ? "Offerte" : eur(shipping)}</dd></div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5"><span className="font-semibold">Total TTC</span><span className="font-display text-3xl font-bold">{eur(grand)}</span></div>
          <p className="mt-1 text-right text-xs text-muted">dont TVA : {eur(vat)}</p>
          <Link href="/commande" className="btn-primary mt-6 w-full">Commander</Link>
          <p className="mt-3 text-center text-xs font-medium uppercase tracking-wide text-muted">Paiement sécurisé</p>
        </aside>
      </div>
    </>
  )
}
