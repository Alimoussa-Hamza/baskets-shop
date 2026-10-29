"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { ProductImage } from "./product-image"

// Couleur choisie sur la fiche produit, partagée entre le sélecteur (ProductForm) et l'image principale.
const Ctx = createContext<{ color: string | null; setColor: (c: string) => void }>({ color: null, setColor: () => {} })

export function ProductColorProvider({ initial, children }: { initial: string | null; children: ReactNode }) {
  const [color, setColor] = useState(initial)
  return <Ctx.Provider value={{ color, setColor }}>{children}</Ctx.Provider>
}

export const useProductColor = () => useContext(Ctx)

export function ProductMainImage({ src, alt }: { src: string | null; alt: string }) {
  const { color } = useProductColor()
  return <ProductImage src={src} alt={color ? `${alt}, coloris ${color}` : alt} color={color} priority sizes="(min-width:768px) 60vw, 100vw" />
}
