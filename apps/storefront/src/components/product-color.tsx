"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { colorParts } from "@/lib/catalog"
import { ProductImage } from "./product-image"

// Couleur choisie sur la fiche produit, partagée entre le sélecteur (ProductForm) et l'image principale.
const Ctx = createContext<{ color: string | null; setColor: (c: string) => void }>({ color: null, setColor: () => {} })

export function ProductColorProvider({ initial, children }: { initial: string | null; children: ReactNode }) {
  const [color, setColor] = useState(initial)
  return <Ctx.Provider value={{ color, setColor }}>{children}</Ctx.Provider>
}

export const useProductColor = () => useContext(Ctx)

/** Grande photo : celle du coloris choisi (photo de variante), sinon celle de la même couleur à une autre réhausse, sinon la photo du produit. */
export function ProductMainImage({ src, alt, byColor = {} }: { src: string | null; alt: string; byColor?: Record<string, string> }) {
  const { color } = useProductColor()
  const base = color ? colorParts(color).base : null
  const shown = (color && byColor[color]) || Object.entries(byColor).find(([c]) => colorParts(c).base === base)?.[1] || src
  return <ProductImage key={shown} src={shown} alt={color ? `${alt}, coloris ${color}` : alt} color={color} priority sizes="(min-width:768px) 60vw, 100vw" />
}
