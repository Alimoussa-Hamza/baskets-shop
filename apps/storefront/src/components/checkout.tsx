"use client"

import Link from "next/link"
import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { listShipping, placeOrder, saveContact, selectShipping, startCardPayment, type Contact, type ShippingChoice } from "@/lib/cart-actions"
import { CardPayment } from "./card-payment"
import { eur } from "@/lib/catalog"

type Step = 1 | 2 | 3

export function Checkout({ initial, total, testPayment, stripeKey }: { initial: Contact; total: number; testPayment: boolean; stripeKey: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [step, setStep] = useState<Step>(1)
  const [c, setC] = useState<Contact>(initial)
  const [options, setOptions] = useState<ShippingChoice[]>([])
  const [option, setOption] = useState<string>("")
  const [accepted, setAccepted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [method, setMethod] = useState<"card" | "test">(stripeKey ? "card" : "test")
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const set = (k: keyof Contact) => (e: React.ChangeEvent<HTMLInputElement>) => setC({ ...c, [k]: e.target.value })
  const fail = (m: string) => setError(m)

  function submitContact(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const saved = await saveContact(c); if (!saved.ok) return fail(saved.error)
      const ship = await listShipping(); if (!ship.ok) return fail(ship.error)
      if (!ship.options.length) return fail("Aucune livraison disponible pour cette adresse.")
      setOptions(ship.options); setOption(ship.options[0].id); setStep(2)
    })
  }
  function submitShipping(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => {
      const r = await selectShipping(option); if (!r.ok) return fail(r.error)
      router.refresh() // met à jour le résumé (livraison, total)
      setStep(3)
      if (method === "card") await prepareCard()
    })
  }
  // Session Stripe ouverte une fois la livraison choisie : le montant du PaymentIntent inclut les frais de port.
  async function prepareCard() {
    setClientSecret(null)
    const r = await startCardPayment()
    if (!r.ok) return fail(r.error)
    setClientSecret(r.clientSecret)
  }
  function chooseMethod(m: "card" | "test") {
    setMethod(m); setError(null)
    if (m === "card" && !clientSecret) start(prepareCard)
  }
  function pay(e: React.FormEvent) {
    e.preventDefault(); setError(null)
    start(async () => { const r = await placeOrder(accepted, "test"); if (r && !r.ok) fail(r.error) }) // en cas de succès : redirection serveur
  }
  const payLabel = `Commander avec obligation de paiement · ${eur(total)}`

  const heading = (n: Step, label: string) => (
    <div className={`flex items-center justify-between border-b border-line pb-3 ${step < n ? "opacity-50" : ""}`}>
      <h2 className="text-xl font-semibold">{n}. {label}</h2>
      {step > n && <button type="button" className="link text-sm" onClick={() => { setError(null); setStep(n) }}>Modifier</button>}
    </div>)

  return (
    <div className="space-y-8">
      <ol className="flex items-center gap-4 text-xs font-semibold uppercase tracking-[0.12em]" aria-label="Étapes de la commande">
        {["Coordonnées", "Livraison", "Paiement"].map((l, i) => (
          <li key={l} className={`flex items-center gap-2 ${step >= i + 1 ? "text-ink" : "text-muted"}`} aria-current={step === i + 1 ? "step" : undefined}>
            <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${step >= i + 1 ? "bg-ink text-white" : "bg-line"}`}>{i + 1}</span><span className="hidden sm:inline">{l}</span></li>))}
      </ol>

      <section aria-labelledby="s1">
        {heading(1, "Vos coordonnées")}
        {step === 1 && (
          <form onSubmit={submitContact} className="mt-6 space-y-4" noValidate>
            <div><label className="label" htmlFor="email">Adresse e-mail</label><input id="email" className="field" type="email" autoComplete="email" required value={c.email} onChange={set("email")} />
              <p className="mt-1 text-xs text-muted">Pour le suivi de votre commande uniquement.</p></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="fn">Prénom</label><input id="fn" className="field" autoComplete="given-name" required value={c.first_name} onChange={set("first_name")} /></div>
              <div><label className="label" htmlFor="ln">Nom</label><input id="ln" className="field" autoComplete="family-name" required value={c.last_name} onChange={set("last_name")} /></div>
            </div>
            <div><label className="label" htmlFor="addr">Adresse de livraison</label><input id="addr" className="field" autoComplete="street-address" required value={c.address_1} onChange={set("address_1")} /></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div><label className="label" htmlFor="zip">Code postal</label><input id="zip" className="field" inputMode="numeric" autoComplete="postal-code" maxLength={5} required value={c.postal_code} onChange={set("postal_code")} /></div>
              <div><label className="label" htmlFor="city">Ville</label><input id="city" className="field" autoComplete="address-level2" required value={c.city} onChange={set("city")} /></div>
            </div>
            <div><label className="label" htmlFor="country">Pays</label><select id="country" className="field" disabled><option>France</option></select>
              <p className="mt-1 text-xs text-muted">Livraison en France uniquement pour le moment.</p></div>
            {error && step === 1 && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
            <button className="btn-dark w-full uppercase tracking-wide" disabled={pending}>{pending ? "Vérification…" : "Continuer vers la livraison"}</button>
          </form>)}
      </section>

      <section aria-labelledby="s2">
        {heading(2, "Mode de livraison")}
        {step === 2 && (
          <form onSubmit={submitShipping} className="mt-6 space-y-3">
            <fieldset><legend className="sr-only">Choisissez un mode de livraison</legend>
              {options.map((o) => (
                <label key={o.id} className={`card flex cursor-pointer items-center justify-between gap-4 p-4 ${option === o.id ? "border-accent ring-1 ring-accent" : ""}`}>
                  <span className="flex items-center gap-3"><input type="radio" name="ship" value={o.id} checked={option === o.id} onChange={() => setOption(o.id)} /><span className="text-sm font-medium">{o.name}</span></span>
                  <span className="text-sm font-medium">{o.amount === 0 ? "Offerte" : eur(o.amount)}</span></label>))}
            </fieldset>
            {error && step === 2 && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
            <button className="btn-dark w-full uppercase tracking-wide" disabled={pending}>{pending ? "Enregistrement…" : "Continuer vers le paiement"}</button>
          </form>)}
      </section>

      <section aria-labelledby="s3">
        {heading(3, "Paiement sécurisé")}
        {step === 3 && (() => {
          const legal = (<>
            <p className="text-sm text-muted">Livraison estimée sous 2 à 4 jours ouvrés. Vous disposez de 14 jours à compter de la réception pour exercer votre droit de rétractation (<Link href="/retractation" target="_blank" className="link">renoncer au contrat ici</Link>).</p>
            <label className="flex items-start gap-3 text-sm"><input type="checkbox" className="mt-1 h-5 w-5" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              <span>J'ai lu et j'accepte les <Link href="/cgv" target="_blank" className="link">conditions générales de vente</Link> et la <Link href="/confidentialite" target="_blank" className="link">politique de confidentialité</Link>.</span></label>
            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
          </>)
          return (
            <div className="mt-6 space-y-5">
              {stripeKey && testPayment && (
                <fieldset className="grid gap-2 sm:grid-cols-2"><legend className="sr-only">Moyen de paiement</legend>
                  {([["card", "Carte bancaire", "Stripe (clés de test)"], ["test", "Paiement factice", "Développement uniquement"]] as const).map(([v, t, h]) => (
                    <label key={v} className={`card flex cursor-pointer items-center gap-3 p-4 ${method === v ? "border-accent ring-1 ring-accent" : ""}`}>
                      <input type="radio" name="pay" checked={method === v} onChange={() => chooseMethod(v)} />
                      <span className="text-sm"><span className="block font-medium">{t}</span><span className="text-muted">{h}</span></span></label>))}
                </fieldset>)}
              {method === "card" && stripeKey ? (
                clientSecret
                  ? <CardPayment publishableKey={stripeKey} clientSecret={clientSecret} accepted={accepted} label={payLabel} onError={setError}>{legal}</CardPayment>
                  : <>{error ? legal : <p className="text-sm text-muted" aria-live="polite">Chargement du paiement sécurisé…</p>}</>
              ) : testPayment ? (
                <form onSubmit={pay} className="space-y-5">
                  <p role="note" className="rounded-[8px] border border-accent bg-white p-4 text-sm">Mode test : aucun paiement réel n'est effectué.</p>
                  {legal}
                  {/* Intitulé du bouton : formulation « obligation de paiement » à faire valider (art. L221-14, non vérifié ici) */}
                  <button className="btn-primary w-full" disabled={pending}>{pending ? "Traitement…" : payLabel}</button>
                </form>
              ) : <p role="note" className="rounded-[8px] border border-line bg-white p-4 text-sm text-muted">Le paiement par carte n'est pas encore activé.</p>}
            </div>)
        })()}
      </section>
    </div>
  )
}
