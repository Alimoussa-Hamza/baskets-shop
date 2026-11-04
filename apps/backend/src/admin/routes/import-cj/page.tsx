import { defineRouteConfig } from "@medusajs/admin-sdk"
import { MagnifyingGlass } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, Table, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api, eurCents } from "../../lib/api"

// Import depuis le catalogue CJdropshipping, comme l'appli DSers/CJ de Shopify : recherche dans le stock d'un
// entrepôt européen, aperçu (pointures, couleurs, coût, prix de vente), puis import en BROUILLON à relire.
type Supplier = { id: string; name: string; country: string; integration: "email" | "cj"; active: boolean }
type Hit = { pid: string; name: string; image: string; stock: number | null; listed: number | null; cost_eur: number | null; blocked_brand: string | null }
type PlanVariant = { vid: string; size: string; color: string; stock: number; costCents: number; landedCents: number; priceEur: number }
type Shipping = { shippingEur: number; deliveryDays: string | null }
type Plan = { title: string; images: string[]; sizes: string[]; colors: string[]; variants: PlanVariant[]; skipped: string[] } | { error: string }
type Category = { id: string; name: string }

const VAT = 1.2

function PreviewDrawer({ hit, supplier, categories, onClose }: { hit: Hit; supplier: Supplier; categories: Category[]; onClose: () => void }) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [shipping, setShipping] = useState<Shipping | null>(null)
  const [already, setAlready] = useState(false)
  const [gender, setGender] = useState<"female" | "male">("female")
  const [category, setCategory] = useState(categories[0]?.id ?? "")
  const [busy, setBusy] = useState(false)
  useEffect(() => {
    api<{ plan: Plan; shipping: Shipping; already_imported: boolean }>(`/cj/products/${hit.pid}?supplier_id=${supplier.id}`)
      .then((r) => { setPlan(r.plan); setShipping(r.shipping); setAlready(r.already_imported) })
      .catch((e) => setPlan({ error: e.message }))
  }, [hit.pid, supplier.id])

  const doImport = async () => {
    setBusy(true)
    try {
      const r = await api<{ product_id: string; variants: number; images: number; skipped: string[] }>(`/cj/products/${hit.pid}/import`, { supplier_id: supplier.id, category_id: category, gender })
      toast.success("Importé en brouillon", { description: `${r.variants} variantes, ${r.images} photos. Relisez le titre et la description, puis publiez.` })
      window.location.href = `/app/products/${r.product_id}`
    } catch (e) { toast.error("Import impossible", { description: (e as Error).message }) } finally { setBusy(false) }
  }

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content className="max-w-2xl">
        <Drawer.Header><Drawer.Title>{hit.name}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {!plan && <Text>Chargement de la fiche CJ…</Text>}
          {plan && "error" in plan && <Text className="text-ui-fg-error">{plan.error}</Text>}
          {plan && !("error" in plan) && <>
            <div className="flex gap-2 overflow-x-auto">{plan.images.slice(0, 6).map((u) => <img key={u} src={u} alt="" className="h-24 w-24 rounded object-cover" />)}</div>
            {already && <Badge color="orange">Déjà importé</Badge>}
            {shipping && <Text size="small">Port CJ vers la France : <strong>{eurCents(Math.round(shipping.shippingEur * 100))}</strong> par paire · délai annoncé au client : <strong>{shipping.deliveryDays ?? "?"} jours</strong></Text>}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-y-1">
                <Label weight="plus">Rayon</Label>
                <Select value={gender} onValueChange={(v) => setGender(v as "female" | "male")}>
                  <Select.Trigger><Select.Value /></Select.Trigger>
                  <Select.Content><Select.Item value="female">Baskets femme</Select.Item><Select.Item value="male">Baskets homme</Select.Item></Select.Content>
                </Select>
              </div>
              <div className="flex flex-col gap-y-1">
                <Label weight="plus">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <Select.Trigger><Select.Value placeholder="Choisir" /></Select.Trigger>
                  <Select.Content>{categories.map((c) => <Select.Item key={c.id} value={c.id}>{c.name}</Select.Item>)}</Select.Content>
                </Select>
              </div>
            </div>
            <Table>
              <Table.Header><Table.Row>
                <Table.HeaderCell>Pointure</Table.HeaderCell><Table.HeaderCell>Couleur</Table.HeaderCell><Table.HeaderCell>Stock {supplier.country.toUpperCase()}</Table.HeaderCell>
                <Table.HeaderCell>Achat</Table.HeaderCell><Table.HeaderCell>Revient</Table.HeaderCell><Table.HeaderCell>Vente TTC</Table.HeaderCell><Table.HeaderCell>Marge / paire</Table.HeaderCell>
              </Table.Row></Table.Header>
              <Table.Body>{plan.variants.map((v) => (
                <Table.Row key={v.vid}>
                  <Table.Cell>{v.size}</Table.Cell><Table.Cell>{v.color}</Table.Cell><Table.Cell>{v.stock}</Table.Cell>
                  <Table.Cell>{eurCents(v.costCents)}</Table.Cell><Table.Cell>{eurCents(v.landedCents)}</Table.Cell><Table.Cell>{eurCents(v.priceEur * 100)}</Table.Cell>
                  <Table.Cell>{eurCents(Math.round((v.priceEur / VAT) * 100) - v.landedCents)}</Table.Cell>
                </Table.Row>))}
              </Table.Body>
            </Table>
            <Text size="xsmall" className="text-ui-fg-subtle">Revient = achat + port CJ + douane (3 € hors UE). Marge = vente HT (TVA 20 %) − revient, avant frais de paiement et retours. Prix de vente = revient × coefficient (CJ_PRICE_COEF), modifiable ensuite dans la fiche produit.</Text>
            {plan.skipped.length > 0 && <details><summary className="text-ui-fg-subtle cursor-pointer text-sm">{plan.skipped.length} variante(s) écartée(s)</summary><ul className="text-ui-fg-subtle mt-1 list-disc pl-5 text-xs">{plan.skipped.map((s) => <li key={s}>{s}</li>)}</ul></details>}
          </>}
        </Drawer.Body>
        <Drawer.Footer>
          <Drawer.Close asChild><Button variant="secondary">Fermer</Button></Drawer.Close>
          <Button onClick={doImport} isLoading={busy} disabled={!plan || "error" in plan || already || !category}>Importer en brouillon</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const ImportCjPage = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [supplierId, setSupplierId] = useState("")
  const [q, setQ] = useState("")
  const [category, setCategory] = useState("femme")
  const [cats, setCats] = useState<{ key: string; label: string }[]>([])
  const [page, setPage] = useState(1)
  const [hits, setHits] = useState<Hit[] | null>(null)
  const [total, setTotal] = useState(0)
  const [busy, setBusy] = useState(false)
  const [open, setOpen] = useState<Hit | null>(null)

  useEffect(() => {
    Promise.all([api<{ suppliers: Supplier[] }>("/suppliers"), api<{ product_categories: Category[] }>("/product-categories?fields=id,name&limit=100")])
      .then(([s, c]) => {
        const cj = s.suppliers.filter((x) => x.integration === "cj" && x.active)
        setSuppliers(cj); setSupplierId(cj[0]?.id ?? ""); setCategories(c.product_categories)
        if (cj[0]) api<{ categories: { key: string; label: string }[] }>(`/cj/products?supplier_id=${cj[0].id}`).then((r) => setCats(r.categories))
      }).catch((e) => toast.error("Chargement impossible", { description: e.message }))
  }, [])
  const supplier = suppliers.find((s) => s.id === supplierId)

  const search = async (e?: React.FormEvent, p = 1) => {
    e?.preventDefault()
    if (!supplier) return
    setBusy(true)
    try {
      const r = await api<{ total: number; products: Hit[] }>(`/cj/products?supplier_id=${supplier.id}&category=${category}&q=${encodeURIComponent(q)}&page=${p}`)
      setHits(r.products); setTotal(r.total); setPage(p)
    } catch (err) { toast.error("Recherche CJ impossible", { description: (err as Error).message }) } finally { setBusy(false) }
  }

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="px-6 py-4">
          <Heading>Import CJdropshipping</Heading>
          <Text size="small" className="text-ui-fg-subtle">Cherchez un modèle dans le stock d'un entrepôt européen de CJ, vérifiez la marge, importez-le en brouillon.</Text>
        </div>
        {suppliers.length === 0 ? (
          <Text className="px-6 py-4" size="small">Aucun fournisseur CJ actif : créez-en un dans « Fournisseurs » (type « API CJ », pays = pays de l'entrepôt, ex. DE) et renseignez CJ_API_KEY dans le .env du backend.</Text>
        ) : (
          <form onSubmit={search} className="flex flex-wrap items-end gap-3 px-6 py-4">
            <div className="flex flex-col gap-y-1">
              <Label weight="plus">Entrepôt</Label>
              <Select value={supplierId} onValueChange={setSupplierId}>
                <Select.Trigger className="w-64"><Select.Value /></Select.Trigger>
                <Select.Content>{suppliers.map((s) => <Select.Item key={s.id} value={s.id}>{s.name} ({s.country.toUpperCase()})</Select.Item>)}</Select.Content>
              </Select>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label weight="plus">Catégorie CJ</Label>
              <Select value={category} onValueChange={setCategory}>
                <Select.Trigger className="w-56"><Select.Value /></Select.Trigger>
                <Select.Content>{cats.map((c) => <Select.Item key={c.key} value={c.key}>{c.label}</Select.Item>)}</Select.Content>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-y-1">
              <Label weight="plus" htmlFor="q">Mot-clé, en anglais (facultatif)</Label>
              <Input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="white, mesh, platform…" />
            </div>
            <Button type="submit" isLoading={busy}>Rechercher</Button>
          </form>
        )}
      </Container>
      {hits && (
        <Container className="p-0">
          <Text size="small" className="text-ui-fg-subtle px-6 py-3">{total} résultat(s) avec du stock en {supplier?.country.toUpperCase()}, les plus vendus d'abord · page {page}</Text>
          <div className="grid grid-cols-2 gap-4 px-6 pb-6 md:grid-cols-4">
            {hits.map((h) => (
              <button key={h.pid} type="button" onClick={() => setOpen(h)} disabled={!!h.blocked_brand}
                className="flex flex-col gap-y-1 rounded-lg border p-2 text-left disabled:opacity-40">
                <img src={h.image} alt="" className="aspect-square w-full rounded object-cover" loading="lazy" />
                <Text size="xsmall" className="line-clamp-2">{h.name}</Text>
                <div className="flex items-center justify-between">
                  <Text size="small" weight="plus">{h.cost_eur ? `${h.cost_eur.toFixed(2).replace(".", ",")} € HT` : "—"}</Text>
                  {h.listed ? <Text size="xsmall" className="text-ui-fg-subtle">vendu par {h.listed} boutiques</Text> : null}
                </div>
                {h.blocked_brand && <Badge color="red" size="2xsmall">Marque « {h.blocked_brand} » : refusé</Badge>}
              </button>
            ))}
          </div>
          <div className="flex justify-between px-6 pb-4">
            <Button size="small" variant="secondary" disabled={page <= 1 || busy} onClick={() => search(undefined, page - 1)}>← Précédents</Button>
            <Button size="small" variant="secondary" disabled={page * 40 >= total || busy} onClick={() => search(undefined, page + 1)}>Suivants →</Button>
          </div>
        </Container>
      )}
      {open && supplier && <PreviewDrawer hit={open} supplier={supplier} categories={categories} onClose={() => setOpen(null)} />}
    </div>
  )
}

export const config = defineRouteConfig({ label: "Import CJ", icon: MagnifyingGlass })

export default ImportCjPage
