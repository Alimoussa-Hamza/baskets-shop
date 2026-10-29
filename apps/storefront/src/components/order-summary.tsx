import { eur } from "@/lib/catalog"
import type { Cart } from "@/lib/cart-data"
import { ProductImage } from "./product-image"

export function OrderSummary({ cart }: { cart: Cart }) {
  const chosen = cart.shipping_methods?.[0]
  return (
    <aside className="card h-fit p-6" aria-label="Résumé de commande">
      <h2 className="text-xl font-semibold">Résumé de commande</h2>
      <ul className="mt-5 divide-y divide-line border-y border-line">
        {cart.items.map((i) => (
          <li key={i.id} className="flex gap-4 py-4">
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-[8px]"><ProductImage src={i.thumbnail ?? null} alt={i.title} color={i.variant_title?.split(" / ")[1]} sizes="64px" /></div>
            <div className="flex-1 text-sm"><p className="font-semibold">{i.title}</p><p className="text-muted">{i.variant_title} · Quantité {i.quantity}</p><p className="mt-1 font-medium">{eur(i.total)}</p></div>
          </li>))}
      </ul>
      <dl className="mt-5 space-y-3 text-sm">
        <div className="flex justify-between"><dt className="text-muted">Sous-total</dt><dd>{eur(cart.item_total)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">Livraison</dt><dd>{chosen ? (chosen.amount === 0 ? "Offerte" : eur(chosen.amount)) : <em>Calculée à l'étape suivante</em>}</dd></div>
      </dl>
      <div className="mt-5 flex items-baseline justify-between border-t border-line pt-5"><span className="font-semibold">Total TTC</span><span className="font-display text-3xl font-bold">{eur(cart.total)}</span></div>
      <p className="mt-1 text-right text-xs text-muted">dont TVA : {eur(cart.tax_total)}</p>
    </aside>
  )
}
