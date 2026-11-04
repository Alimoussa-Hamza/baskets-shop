import { cookies } from "next/headers"
import { medusa, MedusaError } from "./medusa"

export const CART_COOKIE = "cart_id"
export const ORDER_COOKIE = "last_order"

export type CartItem = {
  id: string; title: string; variant_title?: string | null; quantity: number
  unit_price: number; total: number; thumbnail?: string | null; product_handle?: string | null
  product?: { metadata?: Record<string, unknown> | null; status?: string } | null
}
export type Address = {
  first_name?: string | null; last_name?: string | null; address_1?: string | null
  postal_code?: string | null; city?: string | null; country_code?: string | null; phone?: string | null
}
export type Cart = {
  id: string; email?: string | null; currency_code: string; items: CartItem[]
  item_total: number; total: number; tax_total: number; shipping_total: number; discount_total?: number
  shipping_methods?: { id: string; name: string; amount: number; shipping_option_id?: string | null }[]
  shipping_address?: Address | null
  removed?: string[] // articles retirés du panier car plus en vente (produit dépublié depuis l'ajout)
}
export type OrderLine = { id: string; title: string; variant_title?: string | null; quantity: number; total: number; product?: { metadata?: Record<string, unknown> | null } | null }
export type Order = {
  id: string; display_id: number; email: string; total: number; tax_total: number; shipping_total: number
  items: OrderLine[]; shipping_address?: Address | null
  shipping_methods?: { name: string; amount: number }[]
}

export const CART_FIELDS =
  "*items,*items.product,*shipping_methods,*shipping_address,+item_total,+total,+tax_total,+shipping_total,+discount_total"

export async function getCart(): Promise<Cart | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value
  if (!id) return null
  try {
    // `n` : Next mémorise les GET identiques pendant un rendu ; la relecture après suppression doit être une vraie requête
    const load = (n = 0) => medusa<{ cart: Cart & { completed_at?: string | null } }>(
      `/store/carts/${id}?fields=${encodeURIComponent(CART_FIELDS)},completed_at${n ? ",+id" : ""}`,
      { cache: "no-store" },
    )
    let { cart } = await load()
    if (cart.completed_at) return null
    // Un produit dépublié (brouillon, retiré de la vente) ne doit pas pouvoir être commandé depuis un ancien panier
    const gone = cart.items.filter((i) => i.product?.status && i.product.status !== "published")
    if (gone.length) {
      for (const i of gone) await medusa(`/store/carts/${id}/line-items/${i.id}`, { method: "DELETE" })
      ;({ cart } = await load(1))
      cart.removed = gone.map((i) => i.title)
    }
    return cart
  } catch (e) {
    if (e instanceof MedusaError) return null // panier expiré / introuvable : on repartira d'un nouveau
    throw e
  }
}

/** Commande qui vient d'être passée par CE navigateur (cookie httpOnly) : évite d'exposer une commande par son identifiant. */
export async function getLastOrder(): Promise<Order | null> {
  const id = (await cookies()).get(ORDER_COOKIE)?.value
  if (!id) return null
  try {
    const { order } = await medusa<{ order: Order }>(
      `/store/orders/${id}?fields=id,display_id,email,total,tax_total,shipping_total,*items,*items.product,*shipping_address,*shipping_methods`,
      { cache: "no-store" },
    )
    return order
  } catch {
    return null
  }
}

/** Prix de livraison estimé (option la moins chère) pour l'affichage dans le panier. */
export async function getShippingEstimate(cartId: string): Promise<number | null> {
  try {
    const { shipping_options } = await medusa<{ shipping_options: { amount: number }[] }>(`/store/shipping-options?cart_id=${cartId}`, { cache: "no-store" })
    return shipping_options.length ? Math.min(...shipping_options.map((o) => o.amount)) : null
  } catch { return null }
}
