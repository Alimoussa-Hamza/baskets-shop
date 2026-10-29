import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Buildings } from "@medusajs/icons"
import { Badge, Button, Container, Drawer, Heading, Input, Label, Select, StatusBadge, Switch, Table, Text, toast } from "@medusajs/ui"
import { useCallback, useEffect, useState } from "react"
import { api } from "../../lib/api"

// Fournisseurs dropshipping : un fournisseur = un entrepôt (pour CJ, le pays est celui de l'entrepôt d'expédition).
// Pas de suppression (historique des commandes) : on désactive.
type Supplier = {
  id: string; name: string; country: string; email: string; vat_number: string | null; lead_time_days: number
  ships_from_eu: boolean; written_agreement_ref: string | null; integration: "email" | "cj"; logistic_name: string | null; active: boolean
}
type Form = Omit<Supplier, "id">

const EMPTY: Form = { name: "", country: "fr", email: "", vat_number: "", lead_time_days: 5, ships_from_eu: true, written_agreement_ref: "", integration: "email", logistic_name: "", active: true }


function SupplierDrawer({ initial, onClose, onSaved }: { initial: Supplier | null; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Form>(initial ? { ...initial, vat_number: initial.vat_number ?? "", written_agreement_ref: initial.written_agreement_ref ?? "", logistic_name: initial.logistic_name ?? "" } : EMPTY)
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Form>(k: K, v: Form[K]) => setF((x) => ({ ...x, [k]: v }))
  const text = (k: "name" | "country" | "email" | "vat_number" | "written_agreement_ref" | "logistic_name") =>
    ({ id: k, value: (f[k] as string) ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k, e.target.value) })

  const save = async () => {
    setBusy(true)
    try {
      const body = { ...f, vat_number: f.vat_number || null, written_agreement_ref: f.written_agreement_ref || null, logistic_name: f.logistic_name || null }
      await api(initial ? `/suppliers/${initial.id}` : "/suppliers", body)
      toast.success(initial ? "Fournisseur mis à jour" : "Fournisseur créé")
      onSaved()
    } catch (e) { toast.error("Enregistrement impossible", { description: (e as Error).message }) } finally { setBusy(false) }
  }

  const field = (label: string, el: React.ReactNode, hint?: string) => (
    <div className="flex flex-col gap-y-1"><Label size="small" weight="plus">{label}</Label>{el}{hint && <Text size="xsmall" className="text-ui-fg-subtle">{hint}</Text>}</div>)

  return (
    <Drawer open onOpenChange={(o) => !o && onClose()}>
      <Drawer.Content>
        <Drawer.Header><Drawer.Title>{initial ? `Modifier ${initial.name}` : "Nouveau fournisseur"}</Drawer.Title></Drawer.Header>
        <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto">
          {field("Nom", <Input {...text("name")} placeholder="CJ Allemagne" />)}
          {field("Transmission des commandes", (
            <Select value={f.integration} onValueChange={(v) => set("integration", v as Form["integration"])}>
              <Select.Trigger><Select.Value /></Select.Trigger>
              <Select.Content><Select.Item value="email">E-mail (bon de commande)</Select.Item><Select.Item value="cj">API CJdropshipping</Select.Item></Select.Content>
            </Select>))}
          {f.integration === "cj" && field("Transporteur CJ", <Input {...text("logistic_name")} placeholder="CJPacket Euro Ordinary" />, "Obligatoire pour l'API CJ : nom exact du transporteur dans votre espace CJ.")}
          <div className="grid grid-cols-2 gap-4">
            {field("Pays d'expédition", <Input {...text("country")} maxLength={2} placeholder="de" />, "Code à 2 lettres (fr, de, es…)")}
            {field("Délai de préparation (jours)", <Input id="lead" type="number" min={0} max={90} value={f.lead_time_days} onChange={(e) => set("lead_time_days", Number(e.target.value))} />)}
          </div>
          {field("E-mail", <Input {...text("email")} type="email" />, f.integration === "email" ? "Les bons de commande partent à cette adresse." : "Contact du fournisseur.")}
          {field("N° de TVA", <Input {...text("vat_number")} />)}
          {field("Référence de l'accord écrit de revente", <Input {...text("written_agreement_ref")} placeholder="Contrat du …" />, "Règle du projet : aucun produit de marque sans accord écrit.")}
          <div className="flex items-center justify-between"><Label htmlFor="eu">Expédie depuis l'UE</Label><Switch id="eu" checked={f.ships_from_eu} onCheckedChange={(v) => set("ships_from_eu", v)} /></div>
          <div className="flex items-center justify-between"><Label htmlFor="active">Actif</Label><Switch id="active" checked={f.active} onCheckedChange={(v) => set("active", v)} /></div>
        </Drawer.Body>
        <Drawer.Footer>
          <Button variant="secondary" onClick={onClose}>Annuler</Button>
          <Button onClick={save} isLoading={busy} disabled={!f.name || !f.email || f.country.length !== 2}>Enregistrer</Button>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer>
  )
}

const SuppliersPage = () => {
  const [rows, setRows] = useState<Supplier[] | null>(null)
  const [editing, setEditing] = useState<Supplier | "new" | null>(null)
  const load = useCallback(() => {
    api<{ suppliers: Supplier[] }>("/suppliers").then((r) => setRows(r.suppliers)).catch((e) => toast.error("Chargement impossible", { description: e.message }))
  }, [])
  useEffect(load, [load])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading>Fournisseurs</Heading>
          <Text size="small" className="text-ui-fg-subtle">Reliez ensuite chaque produit à son fournisseur depuis la fiche produit (encart « Fournisseur »).</Text>
        </div>
        <Button size="small" variant="secondary" onClick={() => setEditing("new")}>Ajouter</Button>
      </div>
      {rows === null ? <Text className="px-6 py-4">Chargement…</Text> : rows.length === 0 ? <Text className="px-6 py-4">Aucun fournisseur.</Text> : (
        <Table>
          <Table.Header><Table.Row>
            <Table.HeaderCell>Nom</Table.HeaderCell><Table.HeaderCell>Transmission</Table.HeaderCell><Table.HeaderCell>Expédition</Table.HeaderCell>
            <Table.HeaderCell>Accord écrit</Table.HeaderCell><Table.HeaderCell>Statut</Table.HeaderCell><Table.HeaderCell />
          </Table.Row></Table.Header>
          <Table.Body>
            {rows.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>{s.name}<div className="text-ui-fg-muted text-xs">{s.email}</div></Table.Cell>
                <Table.Cell>{s.integration === "cj" ? <Badge size="2xsmall" color="blue">API CJ</Badge> : <Badge size="2xsmall">E-mail</Badge>}{s.logistic_name && <div className="text-ui-fg-muted text-xs">{s.logistic_name}</div>}</Table.Cell>
                <Table.Cell>{s.country.toUpperCase()}{s.ships_from_eu ? " · UE" : " · hors UE"}<div className="text-ui-fg-muted text-xs">{s.lead_time_days} j de préparation</div></Table.Cell>
                <Table.Cell>{s.written_agreement_ref ?? <span className="text-ui-fg-error">Manquant</span>}</Table.Cell>
                <Table.Cell><StatusBadge color={s.active ? "green" : "grey"}>{s.active ? "Actif" : "Inactif"}</StatusBadge></Table.Cell>
                <Table.Cell><Button size="small" variant="transparent" onClick={() => setEditing(s)}>Modifier</Button></Table.Cell>
              </Table.Row>))}
          </Table.Body>
        </Table>)}
      {editing && <SupplierDrawer initial={editing === "new" ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
    </Container>
  )
}

export const config = defineRouteConfig({ label: "Fournisseurs", icon: Buildings })

export default SuppliersPage
