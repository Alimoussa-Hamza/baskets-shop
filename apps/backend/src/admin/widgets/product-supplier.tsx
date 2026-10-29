import { defineWidgetConfig } from "@medusajs/admin-sdk"
import type { AdminProduct, DetailWidgetProps } from "@medusajs/framework/types"
import { Button, Container, Heading, Input, Select, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api, eurCents } from "../lib/api"

// Encart « Fournisseur » de la fiche produit : fournisseur, référence et prix d'achat HT par variante, marge par paire.
// Données portées par les métadonnées des variantes (supplier_id, supplier_sku, supplier_cost_cents).
type Supplier = { id: string; name: string; integration: "email" | "cj"; active: boolean }
type Variant = { id: string; title: string; sku: string | null; metadata: Record<string, unknown> | null; prices?: { amount: number; currency_code: string }[] }
type Row = { id: string; title: string; sku: string; cost: string; priceTtc: number | null }

const NONE = "__none__"
const VAT = 1.2 // TVA 20 % (hypothèse du business plan ; à revoir si franchise de TVA)

const ProductSupplierWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState<string>(NONE)
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    Promise.all([
      api<{ suppliers: Supplier[] }>("/suppliers"),
      api<{ product: { variants: Variant[] } }>(`/products/${data.id}?fields=id,*variants,variants.metadata,*variants.prices`),
    ]).then(([s, p]) => {
      setSuppliers(s.suppliers)
      const vs = p.product.variants ?? []
      const current = vs.map((v) => v.metadata?.supplier_id).find((x): x is string => typeof x === "string")
      setSupplierId(current ?? NONE)
      setRows(vs.map((v) => ({
        id: v.id, title: v.title,
        sku: typeof v.metadata?.supplier_sku === "string" ? v.metadata.supplier_sku : "",
        cost: typeof v.metadata?.supplier_cost_cents === "number" ? (v.metadata.supplier_cost_cents / 100).toFixed(2).replace(".", ",") : "",
        priceTtc: v.prices?.find((x) => x.currency_code === "eur")?.amount ?? null,
      })))
    }).catch((e) => toast.error("Chargement impossible", { description: e.message }))
  }, [data.id])

  const cents = (s: string) => { const n = Number(s.replace(",", ".").trim()); return s.trim() && Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : null }
  const chosen = suppliers.find((s) => s.id === supplierId)

  const save = async () => {
    setBusy(true)
    try {
      await api(`/products/${data.id}/supplier`, {
        supplier_id: supplierId === NONE ? null : supplierId,
        variants: rows.map((r) => ({ id: r.id, supplier_sku: r.sku || null, supplier_cost_cents: cents(r.cost) })),
      })
      toast.success("Fournisseur enregistré")
    } catch (e) { toast.error("Enregistrement impossible", { description: (e as Error).message }) } finally { setBusy(false) }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Fournisseur (dropshipping)</Heading>
          <Text size="small" className="text-ui-fg-subtle">Les commandes de ce produit partent automatiquement chez ce fournisseur.</Text>
        </div>
        <Button size="small" variant="secondary" onClick={save} isLoading={busy}>Enregistrer</Button>
      </div>
      <div className="px-6 py-4">
        <Select value={supplierId} onValueChange={setSupplierId}>
          <Select.Trigger><Select.Value placeholder="Choisir un fournisseur" /></Select.Trigger>
          <Select.Content>
            <Select.Item value={NONE}>Aucun fournisseur</Select.Item>
            {suppliers.filter((s) => s.active || s.id === supplierId).map((s) => <Select.Item key={s.id} value={s.id}>{s.name}{s.integration === "cj" ? " · API CJ" : " · e-mail"}</Select.Item>)}
          </Select.Content>
        </Select>
        {suppliers.length === 0 && <Text size="small" className="text-ui-fg-subtle mt-2">Aucun fournisseur : créez-en un dans « Fournisseurs ».</Text>}
      </div>
      {supplierId !== NONE && rows.length > 0 && (
        <Table>
          <Table.Header><Table.Row>
            <Table.HeaderCell>Variante</Table.HeaderCell>
            <Table.HeaderCell>{chosen?.integration === "cj" ? "Réf. CJ (vid)" : "Réf. fournisseur"}</Table.HeaderCell>
            <Table.HeaderCell>Prix d'achat HT (€)</Table.HeaderCell>
            <Table.HeaderCell>Marge / paire</Table.HeaderCell>
          </Table.Row></Table.Header>
          <Table.Body>
            {rows.map((r, i) => {
              const c = cents(r.cost)
              const margin = c !== null && r.priceTtc !== null ? Math.round((r.priceTtc / VAT) * 100) - c : null
              const set = (k: "sku" | "cost") => (e: React.ChangeEvent<HTMLInputElement>) => setRows((rs) => rs.map((x, j) => (j === i ? { ...x, [k]: e.target.value } : x)))
              return (
                <Table.Row key={r.id}>
                  <Table.Cell>{r.title}</Table.Cell>
                  <Table.Cell><Input size="small" value={r.sku} onChange={set("sku")} aria-label={`Référence fournisseur ${r.title}`} /></Table.Cell>
                  <Table.Cell><Input size="small" inputMode="decimal" value={r.cost} onChange={set("cost")} placeholder="38,00" aria-label={`Prix d'achat ${r.title}`} className="w-28" /></Table.Cell>
                  <Table.Cell className={margin !== null && margin < 0 ? "text-ui-fg-error" : ""}>{margin === null ? "—" : eurCents(margin)}</Table.Cell>
                </Table.Row>)
            })}
          </Table.Body>
        </Table>)}
      {supplierId !== NONE && <Text size="xsmall" className="text-ui-fg-subtle px-6 py-3">Marge avant frais de port, paiement et retours, avec TVA à 20 %. Le business plan vise environ 21 € par commande après ces frais.</Text>}
    </Container>
  )
}

export const config = defineWidgetConfig({ zone: "product.details.after" })

export default ProductSupplierWidget
