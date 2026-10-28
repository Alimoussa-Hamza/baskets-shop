import Image from "next/image"

/** Photo produit, ou emplacement neutre tant que vos photos d'échantillons n'existent pas (jamais d'images de marques). */
export function ProductImage({ src, alt, priority = false, sizes = "(min-width:1024px) 25vw, 50vw" }: { src: string | null; alt: string; priority?: boolean; sizes?: string }) {
  if (src) return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className="object-cover" />
  return (
    <div role="img" aria-label={`${alt} (photo à venir)`} className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[#ececE6] text-muted">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true"><path d="M3 15c0-2 2-3 4-3l3-4c1 1 3 2 5 2l4 2c1 .5 2 1.5 2 3v1H3v-1Z" strokeLinejoin="round" /></svg>
      <span className="text-xs">Photo à venir</span>
    </div>
  )
}
