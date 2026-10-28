"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"
import { medusa, MedusaError, getRegionId } from "./medusa"
import { CART_COOKIE, CART_FIELDS, ORDER_COOKIE, type Cart } from "./cart-data"
import { TEST_PAYMENT } from "./site"

type Result<T = object> = ({ ok: true } & T) | { ok: false; error: string }

const base = { httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/" }

async function ensureCartId(): Promise<string> {
  const jar = await cookies()
  const existing = jar.get(CART_COOKIE)?.value
  if (existing) {
    try {
      const { cart } = await medusa<{ cart: { id: string; completed_at?: string | null } }>(
        `/store/carts/${existing}?fields=id,completed_at`, { cache: "no-store" })
      if (!cart.completed_at) return cart.id
    } catch { /* panier introuvable : on en recrée un */ }
  }
  const region_id = await getRegionId()
  const { cart } = await medusa<{ cart: { id: string } }>("/store/carts", { method: "POST", body: JSON.stringify({ region_id }) })
  jar.set(CART_COOKIE, cart.id, { ...base, maxAge: 60 * 60 * 24 * 30 })
  return cart.id
}

async function currentCartId(): Promise<string | null> {
  return (await cookies()).get(CART_COOKIE)?.value ?? null
}

function friendly(e: unknown): string {
  if (e instanceof MedusaError) {
    if (/inventory|stock|available|quantity/i.test(e.message)) return "Cette taille n'est plus disponible en quantité suffisante."
    return "Une erreur est survenue. Réessayez dans un instant."
  }
  return "Service momentanément indisponible. Réessayez dans un instant."
}

// ---------- Panier
export async function addToCart(variantId: string, quantity = 1): Promise<Result> {
  if (!variantId || quantity < 1 || quantity > 10) return { ok: false, error: "Sélection invalide." }
  try {
    const id = await ensureCartId()
    await medusa(`/store/carts/${id}/line-items`, { method: "POST", body: JSON.stringify({ variant_id: variantId, quantity }) })
    revalidatePath("/panier")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }
}

export async function updateLine(lineId: string, quantity: number): Promise<Result> {
  const id = await currentCartId()
  if (!id) return { ok: false, error: "Panier introuvable." }
  try {
    if (quantity < 1) await medusa(`/store/carts/${id}/line-items/${lineId}`, { method: "DELETE" })
    else await medusa(`/store/carts/${id}/line-items/${lineId}`, { method: "POST", body: JSON.stringify({ quantity: Math.min(quantity, 10) }) })
    revalidatePath("/panier")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }
}

export async function applyPromo(code: string): Promise<Result> {
  const id = await currentCartId()
  const clean = code.trim().slice(0, 40)
  if (!id || !clean) return { ok: false, error: "Saisissez un code." }
  try {
    await medusa(`/store/carts/${id}`, { method: "POST", body: JSON.stringify({ promo_codes: [clean] }) })
    revalidatePath("/panier")
    return { ok: true }
  } catch {
    return { ok: false, error: "Ce code n'est pas valide." }
  }
}

// ---------- Checkout
export type Contact = { email: string; first_name: string; last_name: string; address_1: string; postal_code: string; city: string; phone?: string }

function validateContact(c: Contact): string | null {
  const t = (s: string, max = 120) => typeof s === "string" && s.trim().length > 0 && s.length <= max
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.email) || c.email.length > 254) return "Adresse e-mail invalide."
  if (!t(c.first_name, 60) || !t(c.last_name, 60)) return "Renseignez votre prénom et votre nom."
  if (!t(c.address_1, 160) || !t(c.city, 80)) return "Renseignez votre adresse et votre ville."
  if (!/^\d{5}$/.test(c.postal_code)) return "Le code postal doit comporter 5 chiffres."
  return null
}

export async function saveContact(c: Contact): Promise<Result> {
  const id = await currentCartId()
  if (!id) return { ok: false, error: "Votre panier est vide." }
  const err = validateContact(c)
  if (err) return { ok: false, error: err }
  const addr = { first_name: c.first_name.trim(), last_name: c.last_name.trim(), address_1: c.address_1.trim(), postal_code: c.postal_code, city: c.city.trim(), country_code: "fr", phone: c.phone?.trim() || undefined }
  try {
    await medusa(`/store/carts/${id}`, { method: "POST", body: JSON.stringify({ email: c.email.trim(), shipping_address: addr, billing_address: addr }) })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }
}

export type ShippingChoice = { id: string; name: string; amount: number }

export async function listShipping(): Promise<Result<{ options: ShippingChoice[] }>> {
  const id = await currentCartId()
  if (!id) return { ok: false, error: "Votre panier est vide." }
  try {
    const { shipping_options } = await medusa<{ shipping_options: { id: string; name: string; amount: number }[] }>(
      `/store/shipping-options?cart_id=${id}`, { cache: "no-store" })
    return { ok: true, options: shipping_options.map((o) => ({ id: o.id, name: o.name, amount: o.amount })) }
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }
}

export async function selectShipping(optionId: string): Promise<Result> {
  const id = await currentCartId()
  if (!id) return { ok: false, error: "Votre panier est vide." }
  try {
    await medusa(`/store/carts/${id}/shipping-methods`, { method: "POST", body: JSON.stringify({ option_id: optionId }) })
    return { ok: true }
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }
}

/**
 * Création de la commande APRÈS confirmation du paiement (règle du brief).
 * Aujourd'hui : uniquement le paiement factice de développement (TEST_PAYMENT). Stripe sera branché avec
 * ses clés de test : la session Stripe sera confirmée côté navigateur, puis l'appel à /complete restera ici.
 */
export async function placeOrder(accepted: boolean): Promise<Result> {
  if (!accepted) return { ok: false, error: "Vous devez accepter les conditions générales de vente pour commander." }
  const id = await currentCartId()
  if (!id) return { ok: false, error: "Votre panier est vide." }
  if (!TEST_PAYMENT) return { ok: false, error: "Le paiement par carte n'est pas encore activé." }

  let orderId: string
  try {
    const { cart } = await medusa<{ cart: Cart & { payment_collection?: { id: string } | null } }>(
      `/store/carts/${id}?fields=${encodeURIComponent(CART_FIELDS)},*payment_collection`, { cache: "no-store" })
    if (!cart.email || !cart.shipping_address?.address_1) return { ok: false, error: "Renseignez d'abord vos coordonnées." }
    if (!cart.shipping_methods?.length) return { ok: false, error: "Choisissez un mode de livraison." }

    let pcId = cart.payment_collection?.id
    if (!pcId) {
      const { payment_collection } = await medusa<{ payment_collection: { id: string } }>("/store/payment-collections", { method: "POST", body: JSON.stringify({ cart_id: id }) })
      pcId = payment_collection.id
    }
    await medusa(`/store/payment-collections/${pcId}/payment-sessions`, { method: "POST", body: JSON.stringify({ provider_id: "pp_system_default" }) })

    const done = await medusa<{ type: "order" | "cart"; order?: { id: string }; error?: { message?: string } }>(
      `/store/carts/${id}/complete`, { method: "POST" })
    if (done.type !== "order" || !done.order) return { ok: false, error: done.error?.message ? "Un article n'est plus disponible. Vérifiez votre panier." : "La commande n'a pas pu être finalisée." }
    orderId = done.order.id
  } catch (e) {
    return { ok: false, error: friendly(e) }
  }

  const jar = await cookies()
  jar.set(ORDER_COOKIE, orderId, { ...base, maxAge: 60 * 60 }) // 1 h : suffit pour afficher la confirmation
  jar.delete(CART_COOKIE)
  redirect("/commande/confirmation") // hors try/catch : redirect() lève une exception de contrôle
}
