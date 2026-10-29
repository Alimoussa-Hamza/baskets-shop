// Appels à l'API admin depuis les pages et encarts sur mesure (session de l'admin Medusa, même origine).
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/admin${path}`, {
    method: body ? "POST" : "GET", credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message ?? `Erreur ${res.status}`)
  return json as T
}

export const eurCents = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100)
