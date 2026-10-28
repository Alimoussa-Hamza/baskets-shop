"use client"

import { useState } from "react"
import { recommend, SIZE_TABLE } from "@/lib/sizes"

export function SizeCalculator() {
  const [val, setVal] = useState("")
  const [done, setDone] = useState(false)
  const cm = Number(val.replace(",", "."))
  const r = done ? recommend(cm) : null
  return (
    <>
      <form className="rounded-[12px] bg-accent p-8 text-white" onSubmit={(e) => { e.preventDefault(); setDone(true) }}>
        <h2 className="text-2xl font-semibold">Calculateur de pointure</h2>
        <p className="mt-2 text-white/90">Saisissez la longueur de votre pied en centimètres.</p>
        <div className="mt-5 flex max-w-md gap-3">
          <div className="flex-1"><label htmlFor="cm" className="mb-1 block text-sm font-medium">Longueur du pied (cm)</label>
            <input id="cm" inputMode="decimal" className="field text-ink" placeholder="27,5" value={val} onChange={(e) => { setVal(e.target.value); setDone(false) }} /></div>
          <button className="btn mt-6 bg-white text-accent hover:bg-white/90">Calculer</button>
        </div>
        <div aria-live="polite" className="mt-5 min-h-12">
          {done && (r ? <p className="text-lg">Pointure conseillée : <strong className="text-3xl">{r.eu} EU</strong> <span className="text-white/80">({r.uk} UK · {r.us} US)</span></p>
            : <p role="alert" className="font-medium">Mesure invalide ou hors plage. Saisissez une longueur entre 20 et 32 cm.</p>)}
        </div>
      </form>
      <h2 className="mt-14 text-2xl font-semibold">Tableau de conversion</h2>
      <table className="mt-4 w-full overflow-hidden rounded-[12px] border border-line bg-white text-sm">
        <caption className="sr-only">Conversion longueur du pied, pointures EU, UK et US</caption>
        <thead className="bg-paper text-left text-xs uppercase tracking-wide"><tr><th scope="col" className="p-3">Longueur (cm)</th><th scope="col" className="p-3">EU</th><th scope="col" className="p-3">UK</th><th scope="col" className="p-3">US</th></tr></thead>
        <tbody>{SIZE_TABLE.map((row) => <tr key={row.eu} className="border-t border-line"><td className="p-3">{row.cm.toFixed(1)}</td><th scope="row" className="p-3 text-left">{row.eu}</th><td className="p-3">{row.uk}</td><td className="p-3">{row.us}</td></tr>)}</tbody>
      </table>
    </>
  )
}
