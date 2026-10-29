import { NextResponse, type NextRequest } from "next/server"

// Environnement de test en ligne (staging) : accès par mot de passe (authentification HTTP Basic) et pages
// non indexables. Inactif tant que STAGING_PASSWORD est vide (local, production).
const USER = process.env.STAGING_USER || "equipe"
const PASSWORD = process.env.STAGING_PASSWORD || ""

function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i) // comparaison à temps constant
  return diff === 0
}

export function proxy(req: NextRequest) {
  if (!PASSWORD) return NextResponse.next()
  const [scheme, encoded] = (req.headers.get("authorization") ?? "").split(" ")
  if (scheme === "Basic" && encoded) {
    const [user, ...rest] = atob(encoded).split(":")
    if (safeEqual(user, USER) && safeEqual(rest.join(":"), PASSWORD)) {
      const res = NextResponse.next()
      res.headers.set("X-Robots-Tag", "noindex, nofollow")
      return res
    }
  }
  return new NextResponse("Accès réservé (environnement de test).", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Boutique (test)", charset="UTF-8"', "X-Robots-Tag": "noindex, nofollow" },
  })
}

export const config = {
  // Tout sauf les fichiers statiques et l'optimisation d'images (déjà servis après authentification de la page)
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
