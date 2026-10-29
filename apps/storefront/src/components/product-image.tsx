import Image from "next/image"
import { COLOR_HEX } from "@/lib/catalog"
import { SneakerArt, tint } from "./sneaker-art"

/** Photo produit, ou illustration teintée à la couleur du produit tant que vos photos d'échantillons n'existent pas (jamais d'images de marques). */
export function ProductImage({ src, alt, color, priority = false, sizes = "(min-width:1024px) 25vw, 50vw" }: { src: string | null; alt: string; color?: string | null; priority?: boolean; sizes?: string }) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  const hex = (color && COLOR_HEX[color]) || "#111111"
  return (
    <div role="img" aria-label={`${alt} (photo à venir)`} className="flex h-full w-full items-center justify-center transition-colors duration-500" style={{ background: tint(hex, 0.12) }}>
      <SneakerArt color={hex} className="w-[88%] max-w-[440px] -rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105" />
    </div>
  )
}
