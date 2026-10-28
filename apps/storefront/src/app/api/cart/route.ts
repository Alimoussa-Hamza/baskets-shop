import { NextResponse } from "next/server"
import { getCart } from "@/lib/cart-data"

export const dynamic = "force-dynamic"

// Compteur du panier pour l'en-tête (client) : garde les pages catalogue statiques (ISR).
export async function GET() {
  const cart = await getCart()
  const count = cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0
  return NextResponse.json({ count }, { headers: { "cache-control": "no-store" } })
}
