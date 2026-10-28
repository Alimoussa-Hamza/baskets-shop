"use client"

import { useState } from "react"
import { BACKEND_URL, PUBLISHABLE_KEY } from "@/lib/site"

type Draft = { id: string; order_display_id: number; items: { id: string; title: string }[] }
type Ack = { id: string; status: string; acknowledged_at: string }

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BACKEND_URL}/store/withdrawals/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-publishable-api-key": PUBLISHABLE_KEY },
    body: JSON.stringify(body),
  })
  if (!r.ok) throw new Error(r.status === 429 ? "Trop de tentatives, réessayez dans une minute." : "Aucune commande ne correspond à ces informations.")
  return r.json()
}

// Parcours en 2 étapes, sans compte : (1) identifier la commande, (2) confirmer explicitement.
export function WithdrawalForm() {
  const [email, setEmail] = useState("")
  const [orderNo, setOrderNo] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [ack, setAck] = useState<Ack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function step1(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { setDraft(await post<Draft>("start", { email, order_display_id: Number(orderNo), scope: "full" })) }
    catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  async function step2() {
    if (!draft) return
    setBusy(true); setError(null)
    try { setAck(await post<Ack>("confirm", { id: draft.id, email })) }
    catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  if (ack) {
    return (
      <div role="status" className="card p-5">
        <h2 className="font-semibold">Rétractation enregistrée</h2>
        <p>Accusé de réception : {new Date(ack.acknowledged_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}. Référence {ack.id}. Conservez cette référence.</p>
      </div>
    )
  }
  if (draft) {
    return (
      <div className="space-y-3">
        <h2 className="font-semibold">Étape 2 sur 2 : confirmer</h2>
        <p>Commande n°{draft.order_display_id}. Articles concernés :</p>
        <ul className="list-disc pl-5">{draft.items.map((i) => <li key={i.id}>{i.title}</li>)}</ul>
        <button onClick={step2} disabled={busy} className="btn-dark">Confirmer la rétractation</button>
        {error && <p role="alert" className="font-medium text-danger">{error}</p>}
      </div>
    )
  }
  return (
    <form onSubmit={step1} className="space-y-3">
      <h2 className="font-semibold">Étape 1 sur 2 : identifier la commande</h2>
      <label className="block">Numéro de commande
        <input required inputMode="numeric" value={orderNo} onChange={(e) => setOrderNo(e.target.value)} className="field mt-1" />
      </label>
      <label className="block">E-mail utilisé pour la commande
        <input required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="field mt-1" />
      </label>
      <button disabled={busy} className="btn-dark">Continuer</button>
      {error && <p role="alert" className="font-medium text-danger">{error}</p>}
    </form>
  )
}
