// Illustration de basket ORIGINALE (vue de profil), teintée selon la couleur du produit.
// Sert d'emplacement tant que les photos d'échantillons n'existent pas : aucun motif de marque (ni virgule, ni bandes).

/** Mélange une couleur avec le fond papier : `amount` = part de la couleur (0 à 1). */
export function tint(hex: string, amount: number, base = "#f4f3ee"): string {
  const p = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16))
  const [a, b] = [p(hex), p(base)]
  return `rgb(${a.map((v, i) => Math.round(v * amount + b[i] * (1 - amount))).join(",")})`
}

const isLight = (hex: string) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
  return 0.299 * r + 0.587 * g + 0.114 * b > 186
}

export function SneakerArt({ color = "#111111", accent = "#1f4fff", className = "" }: { color?: string; accent?: string; className?: string }) {
  const light = isLight(color)
  const line = light ? "rgba(17,17,17,0.35)" : "rgba(255,255,255,0.28)"
  const shade = light ? "rgba(17,17,17,0.07)" : "rgba(0,0,0,0.22)"
  return (
    <svg viewBox="0 0 220 110" className={className} aria-hidden="true" focusable="false">
      <ellipse cx="108" cy="99" rx="92" ry="5" fill="rgba(17,17,17,0.10)" />
      {/* Semelle */}
      <path d="M16 80 Q14 94 30 94 L182 94 Q201 94 202 84 L201 77 L18 74 Z" fill="#fbfaf7" stroke="rgba(17,17,17,0.18)" strokeWidth="1.2" />
      <path d="M20 86 L198 86" stroke="rgba(17,17,17,0.12)" strokeWidth="1.2" />
      {/* Tige */}
      <path d="M20 76 L22 44 Q24 30 38 29 L66 27 Q78 27 85 36 L100 49 Q109 55 124 55 L162 56 Q192 58 201 77 Z" fill={color} stroke="rgba(17,17,17,0.22)" strokeWidth="1.2" strokeLinejoin="round" />
      {/* Pare-pierre (bout) et contrefort (talon) */}
      <path d="M158 57 Q191 59 201 77 L158 76 Q150 66 158 57 Z" fill={shade} />
      <path d="M20 76 L22 50 Q34 52 40 62 Q44 70 44 76 Z" fill={shade} />
      {/* Col et languette */}
      <path d="M33 33 Q50 22 70 29 Q63 39 46 40 Q38 39 33 33 Z" fill={light ? "#2a2a2a" : "#0b0b0b"} />
      <path d="M70 29 Q80 22 92 30 L96 40 Q88 34 80 36 Z" fill={color} stroke="rgba(17,17,17,0.22)" strokeWidth="1" />
      {/* Œillets et lacets */}
      {[[82, 37], [90, 43], [98, 48], [107, 52]].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="1.7" fill={line} />
          <path d={`M${x - 5} ${y + 4} L${x + 7} ${y - 3}`} stroke={light ? "#111" : "#fbfaf7"} strokeWidth="2.2" strokeLinecap="round" />
        </g>
      ))}
      {/* Surpiqûre et languette arrière accent */}
      <path d="M48 66 Q95 68 156 67" fill="none" stroke={line} strokeWidth="1.1" strokeDasharray="3 3" />
      <rect x="19" y="40" width="7" height="14" rx="2" fill={accent} />
    </svg>
  )
}
