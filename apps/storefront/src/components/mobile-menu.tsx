"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"

export type MenuSection = { label: string; href: string; links: { label: string; href: string }[] }

// Menu mobile (< md) : panneau latéral gauche, rendu dans <body> (le flou de l'en-tête collant enfermerait un élément fixed). Échap, clic sur le fond ou navigation le ferment ; la page derrière ne défile pas.
export function MobileMenu({ sections }: { sections: MenuSection[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const openerRef = useRef<HTMLButtonElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => setOpen(false), [pathname])
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false) }
    window.addEventListener("keydown", onKey)
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); openerRef.current?.focus() }
  }, [open])

  const item = (href: string) => `flex h-12 items-center justify-between rounded-[8px] px-3 text-[15px] ${pathname === href ? "bg-paper font-semibold text-accent" : "hover:bg-paper"}`

  return (
    <>
      <button ref={openerRef} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-expanded={open} aria-label="Ouvrir le menu"
        className="-ml-2 grid h-11 w-11 place-items-center rounded-full hover:bg-black/5 md:hidden">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
      </button>
      {open && createPortal(
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} aria-hidden="true" />
          <div role="dialog" aria-modal="true" aria-label="Menu" className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <span className="text-sm font-semibold uppercase tracking-[0.14em]">Menu</span>
              <button ref={closeRef} type="button" onClick={() => setOpen(false)} aria-label="Fermer le menu" className="grid h-11 w-11 place-items-center rounded-full text-xl hover:bg-black/5">✕</button>
            </div>
            <nav aria-label="Menu principal" className="flex-1 overflow-y-auto px-3 py-4">
              {sections.map((s) => (
                <div key={s.href} className="mb-5">
                  <Link href={s.href} className="flex h-12 items-center px-3 font-display text-xl font-semibold">{s.label}</Link>
                  <ul>
                    <li><Link href={s.href} className={item(s.href)}>Tout voir<span aria-hidden="true" className="text-muted">→</span></Link></li>
                    {s.links.map((l) => <li key={l.href}><Link href={l.href} className={item(l.href)}>{l.label}<span aria-hidden="true" className="text-muted">→</span></Link></li>)}
                  </ul>
                </div>))}
              <ul className="border-t border-line pt-4">
                <li><Link href="/guide-des-tailles" className={item("/guide-des-tailles")}>Guide des tailles</Link></li>
                <li><Link href="/livraison-et-retours" className={item("/livraison-et-retours")}>Livraison et retours</Link></li>
                <li><Link href="/retractation" className={`${item("/retractation")} text-accent underline underline-offset-2`}>Renoncer au contrat ici</Link></li>
              </ul>
            </nav>
          </div>
        </div>, document.body)}
    </>
  )
}
