import { revalidateTag } from "next/cache"
import { NextResponse } from "next/server"
import { timingSafeEqual } from "node:crypto"

// Appelé par le backend (abonné product-cache) quand un produit change dans l'admin : sans lui, catalogue et fiches
// gardent jusqu'à 5 minutes une version périmée (prix, photos, produit dépublié encore visible).
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET ?? ""
  const given = req.headers.get("x-revalidate-secret") ?? ""
  if (secret.length < 16 || given.length !== secret.length || !timingSafeEqual(Buffer.from(given), Buffer.from(secret)))
    return NextResponse.json({ ok: false }, { status: 401 })
  revalidateTag("products", { expire: 0 })
  return NextResponse.json({ ok: true })
}
