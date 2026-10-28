"use client"

import { useEffect, useState } from "react"

// Consentement : « Tout refuser » et « Tout accepter » au même niveau (même style, même taille).
// Aucun traceur non essentiel n'est chargé aujourd'hui ; ce composant expose le choix pour l'étape Matomo/GA4.
// Durée de validité : 6 mois (à confirmer sur cnil.fr avant la mise en ligne).
const KEY = "consent"
const MAX_AGE = 60 * 60 * 24 * 183
export type Consent = { analytics: boolean; ads: boolean }

export function readConsent(): Consent | null {
  try {
    const m = document.cookie.split("; ").find((c) => c.startsWith(KEY + "="))
    return m ? (JSON.parse(decodeURIComponent(m.split("=")[1])) as Consent) : null
  } catch { return null }
}
function writeConsent(c: Consent) {
  document.cookie = `${KEY}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${MAX_AGE}; Path=/; SameSite=Lax${location.protocol === "https:" ? "; Secure" : ""}`
  window.dispatchEvent(new CustomEvent("consent-changed", { detail: c }))
}

export function CookieSettingsButton() {
  return <button type="button" className="text-left hover:text-accent" onClick={() => window.dispatchEvent(new Event("open-cookie-settings"))}>Gérer mes cookies</button>
}

export function CookieBanner() {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(false)
  const [analytics, setAnalytics] = useState(false)
  const [ads, setAds] = useState(false)

  useEffect(() => {
    if (!readConsent()) setOpen(true)
    const show = () => { const c = readConsent(); setAnalytics(!!c?.analytics); setAds(!!c?.ads); setCustom(true); setOpen(true) }
    window.addEventListener("open-cookie-settings", show)
    return () => window.removeEventListener("open-cookie-settings", show)
  }, [])

  const choose = (c: Consent) => { writeConsent(c); setOpen(false); setCustom(false) }
  if (!open) return null
  const btn = "btn-secondary w-full sm:w-48" // un seul style et une seule largeur pour les trois boutons

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="cookie-title" className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-white p-4 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="mx-auto max-w-[1200px]">
        <h2 id="cookie-title" className="text-base font-semibold">Vos choix sur les cookies</h2>
        <p className="mt-1 max-w-3xl text-sm text-muted">Nous utilisons des cookies nécessaires au fonctionnement du site (panier, sécurité). Avec votre accord, nous mesurons aussi l'audience et la publicité. Vous pouvez changer d'avis à tout moment.</p>
        {custom && (
          <fieldset className="mt-3 space-y-2 text-sm">
            <legend className="sr-only">Catégories de cookies</legend>
            <label className="flex items-center gap-2"><input type="checkbox" checked disabled /> Nécessaires (toujours actifs)</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> Mesure d'audience</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={ads} onChange={(e) => setAds(e.target.checked)} /> Publicité</label>
          </fieldset>
        )}
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <button type="button" className={btn} onClick={() => choose({ analytics: false, ads: false })}>Tout refuser</button>
          <button type="button" className={btn} onClick={() => choose({ analytics: true, ads: true })}>Tout accepter</button>
          {custom
            ? <button type="button" className={btn} onClick={() => choose({ analytics, ads })}>Enregistrer mes choix</button>
            : <button type="button" className={btn} onClick={() => setCustom(true)}>Personnaliser</button>}
        </div>
      </div>
    </div>
  )
}
