import { defineRouteConfig } from "@medusajs/admin-sdk"
import { TruckFast } from "@medusajs/icons"
import { Button, Container, Heading, Input, StatusBadge, Table, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"

// Commandes fournisseur (dropshipping) : suivi de la transmission, saisie du numéro de suivi, relance en cas d'échec.
type Row = {
  id: string; status: "to_place" | "placed" | "shipped" | "delivered" | "cancelled"; order_id: string; order_display_id: number | null
  supplier: { name: string; integration: "email" | "cj" }; supplier_reference: string | null
  tracking_number: string | null; carrier: string | null; cost_total_cents: number | null
  lines: { title: string; variant: string | null; quantity: number }[]; last_error: string | null; created_at: string
}

const STATUS: Record<Row["status"], { label: string; color: "orange" | "blue" | "green" | "grey" | "red" }> = {
  to_place: { label: "À passer", color: "orange" }, placed: { label: "Transmise", color: "blue" },
  shipped: { label: "Expédiée", color: "green" }, delivered: { label: "Livrée", color: "green" }, cancelled: { label: "Annulée", color: "grey" },
}
const eur = (cents: number) => new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100)

async function api<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`/admin${path}`, {
    method: body ? "POST" : "GET", credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.message ?? `Erreur ${res.status}`)
  return json as T
}

function ShipForm({ row, onDone }: { row: Row; onDone: () => void }) {
  const [tracking, setTracking] = useState("")
  const [carrier, setCarrier] = useState("")
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    setBusy(true)
    try {
      await api(`/supplier-orders/${row.id}/ship`, { tracking_number: tracking, carrier: carrier || undefined })
      toast.success("Expédition enregistrée", { description: "Le client a reçu l'e-mail de suivi." })
      onDone()
    } catch (e) { toast.error("Échec", { description: (e as Error).message }) } finally { setBusy(false) }
  }
  return (
    <div className="flex items-center gap-2">
      <Input size="small" placeholder="N° de suivi" value={tracking} onChange={(e) => setTracking(e.target.value)} aria-label="Numéro de suivi" />
      <Input size="small" placeholder="Transporteur" value={carrier} onChange={(e) => setCarrier(e.target.value)} aria-label="Transporteur" className="w-32" />
      <Button size="small" variant="secondary" disabled={busy || tracking.trim().length < 3} onClick={submit}>Expédiée</Button>
    </div>
  )
}

const SupplierOrdersPage = () => {
  const [rows, setRows] = useState<Row[] | null>(null)
  const load = useCallback(() => {
    api<{ supplier_orders: Row[] }>("/supplier-orders").then((r) => setRows(r.supplier_orders)).catch((e) => toast.error("Chargement impossible", { description: e.message }))
  }, [])
  useEffect(load, [load])

  const retry = async (row: Row) => {
    try {
      const r = await api<{ supplier_order: { status: string; last_error: string | null } }>(`/supplier-orders/${row.id}/retry`, {})
      if (r.supplier_order.status === "placed") toast.success("Commande transmise")
      else toast.error("Toujours en échec", { description: r.supplier_order.last_error ?? "" })
      load()
    } catch (e) { toast.error("Échec", { description: (e as Error).message }) }
  }

  return (
    <Container className="divide-y p-0">
      <div className="px-6 py-4">
        <Heading>Commandes fournisseur</Heading>
        <Text size="small" className="text-ui-fg-subtle">Créées automatiquement à chaque commande payée. Les commandes CJ se valident et se paient dans votre espace CJ.</Text>
      </div>
      {rows === null ? <Text className="px-6 py-4">Chargement…</Text> : rows.length === 0 ? <Text className="px-6 py-4">Aucune commande fournisseur pour le moment.</Text> : (
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>Commande</Table.HeaderCell><Table.HeaderCell>Fournisseur</Table.HeaderCell><Table.HeaderCell>Articles</Table.HeaderCell>
              <Table.HeaderCell>Coût d'achat</Table.HeaderCell><Table.HeaderCell>Statut</Table.HeaderCell><Table.HeaderCell>Suivi</Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {rows.map((r) => (
              <Table.Row key={r.id}>
                <Table.Cell><a className="text-ui-fg-interactive" href={`/app/orders/${r.order_id}`}>#{r.order_display_id ?? "?"}</a></Table.Cell>
                <Table.Cell>{r.supplier.name}<div className="text-ui-fg-muted text-xs">{r.supplier.integration === "cj" ? "API CJ" : "E-mail"}{r.supplier_reference ? ` · ${r.supplier_reference}` : ""}</div></Table.Cell>
                <Table.Cell>{r.lines.map((l, i) => <div key={i}>{l.quantity} × {l.title}{l.variant ? ` (${l.variant})` : ""}</div>)}</Table.Cell>
                <Table.Cell>{r.cost_total_cents === null ? "—" : eur(r.cost_total_cents)}</Table.Cell>
                <Table.Cell>
                  <StatusBadge color={STATUS[r.status].color}>{STATUS[r.status].label}</StatusBadge>
                  {r.last_error && <div className="text-ui-fg-error mt-1 max-w-[260px] text-xs">{r.last_error}</div>}
                </Table.Cell>
                <Table.Cell>
                  {r.status === "to_place" && <Button size="small" variant="secondary" onClick={() => retry(r)}>Relancer</Button>}
                  {r.status === "placed" && <ShipForm row={r} onDone={load} />}
                  {(r.status === "shipped" || r.status === "delivered") && <span>{r.tracking_number}{r.carrier ? ` · ${r.carrier}` : ""}</span>}
                </Table.Cell>
              </Table.Row>))}
          </Table.Body>
        </Table>)}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Commandes fournisseur", icon: TruckFast })

export default SupplierOrdersPage
