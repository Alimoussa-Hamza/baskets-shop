"use client"

import { useState, type ReactNode } from "react"
import { loadStripe, type Stripe } from "@stripe/stripe-js"
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { placeOrder } from "@/lib/cart-actions"

// Formulaire Stripe (Payment Element) : la carte est saisie dans un cadre hébergé par Stripe, jamais par nos serveurs.
// Le paiement est confirmé ici ; la commande n'est créée qu'ensuite (placeOrder → /complete).
let stripePromise: Promise<Stripe | null> | null = null
const getStripe = (key: string) => (stripePromise ??= loadStripe(key, { locale: "fr" }))

const appearance = {
  theme: "stripe" as const,
  variables: { colorPrimary: "#1f4fff", colorText: "#111111", colorDanger: "#b42318", fontFamily: "Inter, system-ui, sans-serif", borderRadius: "8px", spacingUnit: "4px" },
}

type Props = { publishableKey: string; clientSecret: string; accepted: boolean; label: string; onError: (m: string | null) => void; onStale: () => void; children?: ReactNode }

export function CardPayment(props: Props) {
  return (
    <Elements stripe={getStripe(props.publishableKey)} options={{ clientSecret: props.clientSecret, appearance, locale: "fr" }}>
      <CardForm {...props} />
    </Elements>
  )
}

function CardForm({ accepted, label, onError, onStale, children }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [busy, setBusy] = useState(false)

  async function pay() {
    onError(null)
    if (!accepted) return onError("Vous devez accepter les conditions générales de vente pour commander.")
    if (!stripe || !elements) return
    setBusy(true)
    const { error } = await stripe.confirmPayment({
      elements,
      redirect: "if_required", // carte sans 3D Secure : pas de redirection ; sinon retour sur /commande/retour
      confirmParams: { return_url: `${window.location.origin}/commande/retour` },
    })
    if (error) {
      setBusy(false)
      // Panier modifié ailleurs (autre onglet) pendant le paiement : Medusa a annulé l'ancien paiement.
      // On rouvre une session au nouveau montant plutôt que de laisser le client bloqué.
      if (error.code === "payment_intent_unexpected_state" || error.payment_intent?.status === "canceled") {
        onError("Votre panier a été modifié pendant le paiement. Aucun montant n'a été débité : vérifiez le nouveau total, puis payez à nouveau.")
        return onStale()
      }
      return onError(error.type === "card_error" || error.type === "validation_error" ? error.message ?? "Paiement refusé." : "Le paiement n'a pas abouti. Aucun montant n'a été débité.")
    }
    const r = await placeOrder(true, "card") // succès : redirection serveur vers la confirmation
    if (r && !r.ok) { setBusy(false); onError(r.error) }
  }

  return (
    <div className="space-y-5">
      <div className="rounded-[12px] border border-line bg-white p-4"><PaymentElement options={{ layout: "tabs" }} /></div>
      {children}
      <button type="button" onClick={pay} className="btn-primary w-full" disabled={busy || !stripe}>{busy ? "Paiement en cours…" : label}</button>
    </div>
  )
}
