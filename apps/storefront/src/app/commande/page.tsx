import type { Metadata } from "next"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getCart } from "@/lib/cart-data"
import { Checkout } from "@/components/checkout"
import { OrderSummary } from "@/components/order-summary"
import { TEST_PAYMENT } from "@/lib/site"

export const metadata: Metadata = { title: "Commande", robots: { index: false } }
export const dynamic = "force-dynamic"

export default async function CheckoutPage() {
  const cart = await getCart()
  if (!cart || cart.items.length === 0) redirect("/panier")
  const a = cart.shipping_address
  return (
    <>
      <h1 className="sr-only">Commande</h1>
      <p className="mb-6 text-sm"><Link href="/panier" className="link">← Retour au panier</Link></p>
      <div className="grid gap-10 lg:grid-cols-[1fr_400px]">
        <Checkout
          testPayment={TEST_PAYMENT}
          total={cart.total}
          initial={{ email: cart.email ?? "", first_name: a?.first_name ?? "", last_name: a?.last_name ?? "", address_1: a?.address_1 ?? "", postal_code: a?.postal_code ?? "", city: a?.city ?? "" }}
        />
        <OrderSummary cart={cart} />
      </div>
    </>
  )
}
