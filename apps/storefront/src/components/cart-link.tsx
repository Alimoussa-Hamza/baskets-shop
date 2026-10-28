"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"

export function CartLink() {
  const [count, setCount] = useState(0)
  const pathname = usePathname()
  useEffect(() => {
    let alive = true
    fetch("/api/cart", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { count: number }) => alive && setCount(d.count))
      .catch(() => undefined)
    return () => { alive = false }
  }, [pathname])
  return (
    <Link href="/panier" aria-label={`Panier, ${count} article${count > 1 ? "s" : ""}`} className="relative inline-flex h-11 w-11 items-center justify-center">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M6 7h12l-1 12H7L6 7Z" strokeLinejoin="round" /><path d="M9 7a3 3 0 0 1 6 0" /></svg>
      {count > 0 && <span className="absolute right-0.5 top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">{count}</span>}
    </Link>
  )
}
