// Modèles d'e-mails transactionnels. Texte brut + HTML simple (sans image externe ni pixel de suivi :
// aucun traceur dans les e-mails transactionnels).
export type Mail = { subject: string; html: string; text: string }

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!)
export const eur = (n: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(n)
const paris = (d: Date) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "long", timeStyle: "medium", timeZone: "Europe/Paris" }).format(d)

const SHOP = process.env.SHOP_NAME ?? "SNEAKR"
// Identité légale de l'éditeur : à compléter une fois le statut et l'immatriculation connus.
const LEGAL = process.env.SHOP_LEGAL_LINE ?? "[Raison sociale, SIRET et adresse à compléter avant le lancement]"

const wrap = (title: string, body: string) => `<!doctype html><html lang="fr"><body style="font-family:Arial,sans-serif;color:#111;max-width:560px;margin:auto;padding:16px">
<h1 style="font-size:20px">${esc(title)}</h1>${body}
<hr style="border:none;border-top:1px solid #ddd;margin:24px 0"><p style="font-size:12px;color:#555">${esc(SHOP)} · ${esc(LEGAL)}</p></body></html>`

export type WithdrawalAckData = {
  reference: string; orderDisplayId: number; acknowledgedAt: Date; scope: "full" | "partial"; itemTitles: string[]
}

/** Accusé de réception de rétractation : support durable avec date et heure (service-public F23455). */
export function withdrawalAck(d: WithdrawalAckData): Mail {
  const when = paris(d.acknowledgedAt)
  const items = d.itemTitles.length ? d.itemTitles : ["Tous les articles de la commande"]
  const subject = `Accusé de réception de votre rétractation – commande n° ${d.orderDisplayId}`
  const text = [
    `Nous accusons réception de votre demande de rétractation.`, ``,
    `Date et heure de réception : ${when} (heure de Paris)`, `Référence : ${d.reference}`, `Commande n° ${d.orderDisplayId}`,
    `Articles concernés :`, ...items.map((i) => `- ${i}`), ``,
    `Conservez cet e-mail. Nous reviendrons vers vous pour les modalités de retour et de remboursement.`,
  ].join("\n")
  const html = wrap("Accusé de réception de votre rétractation", `
<p>Nous accusons réception de votre demande de rétractation.</p>
<table style="border-collapse:collapse;font-size:14px"><tr><td style="padding:4px 12px 4px 0;color:#555">Date et heure</td><td><strong>${esc(when)}</strong> (heure de Paris)</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#555">Référence</td><td>${esc(d.reference)}</td></tr>
<tr><td style="padding:4px 12px 4px 0;color:#555">Commande</td><td>n° ${esc(d.orderDisplayId)}</td></tr></table>
<p>Articles concernés :</p><ul>${items.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>
<p>Conservez cet e-mail. Nous reviendrons vers vous pour les modalités de retour et de remboursement.</p>`)
  return { subject, html, text }
}

export type OrderMailData = {
  displayId: number; items: { title: string; variant?: string | null; quantity: number; total: number }[]
  shippingName?: string; shippingTotal: number; taxTotal: number; total: number
  address?: string
}

export function orderConfirmation(d: OrderMailData): Mail {
  const subject = `Confirmation de votre commande n° ${d.displayId}`
  const lines = d.items.map((i) => `${i.quantity} × ${i.title}${i.variant ? ` (${i.variant})` : ""} – ${eur(i.total)}`)
  const text = [
    `Merci pour votre commande n° ${d.displayId}.`, ``, ...lines,
    `Livraison${d.shippingName ? ` (${d.shippingName})` : ""} : ${eur(d.shippingTotal)}`,
    `Total TTC : ${eur(d.total)} (dont TVA ${eur(d.taxTotal)})`, ``,
    d.address ? `Adresse de livraison : ${d.address}` : ``, ``,
    `Droit de rétractation : vous disposez de 14 jours à compter de la réception pour renoncer à votre achat, depuis la page « Renoncer au contrat ici » du site, sans compte.`,
  ].join("\n")
  const html = wrap(`Merci pour votre commande n° ${d.displayId}`, `
<ul>${d.items.map((i) => `<li>${esc(i.quantity)} × ${esc(i.title)}${i.variant ? ` (${esc(i.variant)})` : ""} – ${esc(eur(i.total))}</li>`).join("")}</ul>
<p>Livraison${d.shippingName ? ` (${esc(d.shippingName)})` : ""} : ${esc(eur(d.shippingTotal))}<br><strong>Total TTC : ${esc(eur(d.total))}</strong> (dont TVA ${esc(eur(d.taxTotal))})</p>
${d.address ? `<p>Adresse de livraison : ${esc(d.address)}</p>` : ""}
<p style="font-size:13px">Droit de rétractation : vous disposez de 14 jours à compter de la réception pour renoncer à votre achat, depuis la page « Renoncer au contrat ici » du site, sans compte.</p>`)
  return { subject, html, text }
}
