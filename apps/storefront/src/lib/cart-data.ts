import { cookies } from "next/headers"
import { medusa, MedusaError } from "./medusa"

export const CART_COOKIE = "cart_id"
export const ORDER_COOKIE = "last_order"

export type CartItem = {
  id: string; title: string; variant_title?: string | null; quantity: number
  unit_price: number; total: number; thumbnail?: string | null; product_handle?: string | null
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
}
export type OrderLine = { id: string; title: string; variant_title?: string | null; quantity: number; total: number }
export type Order = {
  id: string; display_id: number; email: string; total: number; tax_total: number; shipping_total: number
  items: OrderLine[]; shipping_address?: Address | null
  shipping_methods?: { name: string; amount: number }[]
}

export const CART_FIELDS =
  "*items,*shipping_methods,*shipping_address,+item_total,+total,+tax_total,+shipping_total,+discount_total"

export async function getCart(): Promise<Cart | null> {
  const id = (await cookies()).get(CART_COOKIE)?.value
  if (!id) return null
  try {
    const { cart } = await medusa<{ cart: Cart & { completed_at?: string | null } }>(
      `/store/carts/${id}?fields=${encodeURIComponent(CART_FIELDS)},completed_at`,
      { cache: "no-store" },
    )
    return cart.completed_at ? null : cart
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
      `/store/orders/${id}?fields=id,display_id,email,total,tax_total,shipping_total,*items,*shipping_address,*shipping_methods`,
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
