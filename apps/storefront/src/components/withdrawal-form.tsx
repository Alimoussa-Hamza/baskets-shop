"use client"

import { useState } from "react"
import { BACKEND_URL, PUBLISHABLE_KEY } from "@/lib/site"

type Item = { id: string; title: string; variant: string | null; quantity: number; already_withdrawn: boolean }
type Draft = { id: string; order_display_id: number; items: Item[] }
type Ack = { id: string; status: string; acknowledged_at: string }

async function post<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BACKEND_URL}/store/withdrawals/${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-publishable-api-key": PUBLISHABLE_KEY },
    body: JSON.stringify(body),
  })
  if (r.status === 429) throw new Error("Trop de tentatives, réessayez dans une minute.")
  if (r.status === 400) throw new Error("Choisissez au moins un article de la commande.")
  if (!r.ok) throw new Error("Aucune commande ne correspond à ces informations.")
  return r.json()
}

// Parcours en 2 étapes, sans compte : (1) identifier la commande, (2) choisir toute la commande ou certains
// articles, puis confirmer explicitement. L'accusé horodaté est aussi envoyé par e-mail (support durable).
export function WithdrawalForm() {
  const [email, setEmail] = useState("")
  const [orderNo, setOrderNo] = useState("")
  const [draft, setDraft] = useState<Draft | null>(null)
  const [scope, setScope] = useState<"full" | "partial">("full")
  const [picked, setPicked] = useState<string[]>([])
  const [ack, setAck] = useState<{ ack: Ack; items: Item[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const open = draft?.items.filter((i) => !i.already_withdrawn) ?? []
  const chosen = scope === "full" ? open : open.filter((i) => picked.includes(i.id))

  async function step1(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setError(null)
    try { setDraft(await post<Draft>("start", { email, order_display_id: Number(orderNo), scope: "full" })) }
    catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  async function step2() {
    if (!draft) return
    if (chosen.length === 0) return setError("Choisissez au moins un article de la commande.")
    setBusy(true); setError(null)
    // « Toute la commande » alors qu'une partie est déjà rétractée : on envoie les articles restants
    const partial = scope === "partial" || open.length < draft.items.length
    try {
      const a = await post<Ack>("confirm", { id: draft.id, email, scope: partial ? "partial" : "full", item_ids: partial ? chosen.map((i) => i.id) : undefined })
      setAck({ ack: a, items: chosen })
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  const toggle = (id: string) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
  const label = (i: Item) => `${i.quantity > 1 ? `${i.quantity} × ` : ""}${i.title}${i.variant ? ` (${i.variant})` : ""}`

  if (ack) {
    return (
      <div role="status" className="card space-y-3 p-6">
        <h2 className="text-xl font-semibold">Rétractation enregistrée</h2>
        <p>Accusé de réception : <strong>{new Date(ack.ack.acknowledged_at).toLocaleString("fr-FR", { timeZone: "Europe/Paris" })}</strong> (heure de Paris). Référence <strong>{ack.ack.id}</strong>.</p>
        <p className="text-sm text-muted">Articles concernés :</p>
        <ul className="list-disc pl-5 text-sm">{ack.items.map((i) => <li key={i.id}>{label(i)}</li>)}</ul>
        <p className="text-sm text-muted">Un e-mail de confirmation vous est envoyé. Conservez-le avec cette référence.</p>
      </div>
    )
  }

  if (draft) {
    const allDone = open.length === 0
    return (
      <div className="space-y-5">
        <h2 className="text-xl font-semibold">Étape 2 sur 2 : confirmer</h2>
        <p>Commande n° {draft.order_display_id}</p>
        {allDone ? <p className="card p-4 text-sm">Une rétractation a déjà été enregistrée pour tous les articles de cette commande.</p> : (<>
          <fieldset className="grid gap-2 sm:grid-cols-2"><legend className="mb-2 text-sm font-medium">Vous renoncez à :</legend>
            {([["full", "Toute la commande", `${open.length} article${open.length > 1 ? "s" : ""}`], ["partial", "Certains articles", "Choisissez ci-dessous"]] as const).map(([v, t, h]) => (
              <label key={v} className={`card flex cursor-pointer items-center gap-3 p-4 ${scope === v ? "border-accent ring-1 ring-accent" : ""}`}>
                <input type="radio" name="scope" checked={scope === v} onChange={() => { setScope(v); setError(null) }} />
                <span className="text-sm"><span className="block font-medium">{t}</span><span className="text-muted">{h}</span></span>
              </label>))}
          </fieldset>
          <ul className="divide-y divide-line border-y border-line">
            {draft.items.map((i) => (
              <li key={i.id} className="flex items-center gap-3 py-3 text-sm">
                {scope === "partial" && !i.already_withdrawn
                  ? <input type="checkbox" className="h-5 w-5" checked={picked.includes(i.id)} onChange={() => toggle(i.id)} aria-label={`Renoncer à ${label(i)}`} />
                  : <span aria-hidden="true" className="w-5" />}
                <span className={i.already_withdrawn ? "text-muted line-through" : ""}>{label(i)}</span>
                {i.already_withdrawn && <span className="ml-auto text-xs text-muted">Déjà rétracté</span>}
              </li>))}
          </ul>
          <p className="text-sm text-muted">{chosen.length === 0 ? "Aucun article choisi." : `Vous renoncez à ${chosen.length} article${chosen.length > 1 ? "s" : ""}.`}</p>
          <button onClick={step2} disabled={busy || chosen.length === 0} className="btn-dark">Confirmer la rétractation</button>
        </>)}
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
