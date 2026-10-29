import { ImageResponse } from "next/og"
import { SITE_NAME } from "@/lib/site"

// Image de partage par défaut (réseaux sociaux, messageries). Les fiches produit avec photo utilisent leur propre image.
export const alt = `${SITE_NAME} – Baskets homme et femme`
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 80, background: "#111111", color: "#ffffff" }}>
        <div style={{ display: "flex", fontSize: 96, fontWeight: 700 }}>{SITE_NAME}<span style={{ color: "#1f4fff" }}>.</span></div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 44, color: "rgba(255,255,255,0.8)" }}>Baskets homme et femme</div>
        <div style={{ display: "flex", marginTop: 48, fontSize: 30, color: "rgba(255,255,255,0.6)" }}>Guide des tailles en cm · Livraison en France · Retours sous 14 jours</div>
      </div>
    ),
    size,
  )
}
