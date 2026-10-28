import { BACKEND_URL, PUBLISHABLE_KEY } from "./site"

export class MedusaError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

type Init = Omit<RequestInit, "next"> & { next?: { revalidate?: number | false; tags?: string[] } }

export async function medusa<T>(path: string, init: Init = {}): Promise<T> {
  const res = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: { "content-type": "application/json", "x-publishable-api-key": PUBLISHABLE_KEY, ...(init.headers ?? {}) },
  })
  const body = (await res.json().catch(() => ({}))) as { message?: string }
  if (!res.ok) throw new MedusaError(body.message ?? res.statusText, res.status)
  return body as T
}

// --- Types minimaux (champs réellement demandés à l'API)
export type Variant = {
  id: string
  title: string
  sku?: string | null
  inventory_quantity?: number | null
  options?: { value: string; option?: { title: string } | null }[]
  calculated_price?: { calculated_amount: number; currency_code: string } | null
  metadata?: Record<string, unknown> | null
}
export type Product = {
  id: string
  title: string
  handle: string
  subtitle?: string | null
  description?: string | null
  thumbnail?: string | null
  images?: { url: string }[] | null
  metadata?: Record<string, unknown> | null
  categories?: { handle: string; name: string }[] | null
  options?: { title: string; values: { value: string }[] }[]
  variants?: Variant[]
}

const PRODUCT_FIELDS = [
  "id", "title", "handle", "subtitle", "description", "thumbnail", "metadata",
  "*images", "*categories", "*options", "*options.values",
  "variants.id", "variants.title", "variants.sku", "variants.inventory_quantity", "variants.metadata",
  "*variants.options", "*variants.options.option", "variants.calculated_price", // « variants.options.option.title » seul renvoie options vides
].join(",")

// Au build en CI (sans backend) : BUILD_WITHOUT_BACKEND=1 tolère l'échec. En production : l'échec fait échouer
// le build, pour ne jamais figer une page vide dans le cache ISR.
const tolerant = process.env.BUILD_WITHOUT_BACKEND === "1"

export async function getRegionId(): Promise<string> {
  const { regions } = await medusa<{ regions: { id: string; countries?: { iso_2: string }[] }[] }>(
    "/store/regions?fields=id,*countries",
    { next: { revalidate: 3600 } },
  )
  const fr = regions.find((r) => r.countries?.some((c) => c.iso_2 === "fr")) ?? regions[0]
  if (!fr) throw new Error("Aucune région configurée dans Medusa (lancer le seed)")
  return fr.id
}

export async function listProducts(): Promise<Product[]> {
  try {
    const region = await getRegionId()
    const { products } = await medusa<{ products: Product[] }>(
      `/store/products?limit=100&region_id=${region}&fields=${PRODUCT_FIELDS}`,
      { next: { revalidate: 300, tags: ["products"] } },
    )
    return products
  } catch (e) {
    if (tolerant) return []
    throw e
  }
}

export async function getProduct(handle: string): Promise<Product | null> {
  try {
    const region = await getRegionId()
    const { products } = await medusa<{ products: Product[] }>(
      `/store/products?handle=${encodeURIComponent(handle)}&region_id=${region}&fields=${PRODUCT_FIELDS}`,
      { next: { revalidate: 300, tags: ["products"] } },
    )
    return products[0] ?? null
  } catch (e) {
    if (tolerant) return null
    throw e
  }
}
