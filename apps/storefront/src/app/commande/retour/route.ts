import { NextResponse, type NextRequest } from "next/server"
import { finalizeCurrentCart } from "@/lib/cart-actions"

// Retour après une redirection Stripe (3D Secure, portefeuilles). Stripe ajoute redirect_status.
// Succès : finalizeCurrentCart() crée la commande et redirige vers la confirmation (Medusa revérifie le paiement).
export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get("redirect_status") !== "failed") {
    const r = await finalizeCurrentCart()
    if (r.ok) return NextResponse.redirect(new URL("/commande/confirmation", req.url))
  }
  return NextResponse.redirect(new URL("/commande?paiement=refuse", req.url))
}
