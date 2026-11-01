import { defineRouteConfig } from "@medusajs/admin-sdk"
import { Tag } from "@medusajs/icons"
import { Button, Container, Heading, Input, Label, Switch, Text, toast } from "@medusajs/ui"
import { useEffect, useState } from "react"
import { api } from "../../lib/api"

// Offre en cours (Black Friday, Noël…) : bandeau de la boutique. Les remises elles-mêmes se gèrent avec les
// pages natives de Medusa : « Price Lists » (prix barrés) et « Promotions » (codes promo).
type Campaign = { active: boolean; text: string; link: string | null; ends_at: string | null }

// <input type="datetime-local"> attend l'heure locale sans fuseau
const toLocal = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "")

const OffrePage = () => {
  const [c, setC] = useState<Campaign | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { api<{ campaign: Campaign }>("/campaign").then((r) => setC(r.campaign)).catch((e) => toast.error("Chargement impossible", { description: e.message })) }, [])
  if (!c) return <Container><Text>Chargement…</Text></Container>

  const save = async () => {
    setBusy(true)
    try {
      const r = await api<{ campaign: Campaign }>("/campaign", { ...c, link: c.link || null, ends_at: c.ends_at || null })
      setC(r.campaign)
      toast.success(r.campaign.active ? "Bandeau en ligne" : "Bandeau désactivé", { description: "Visible sur la boutique d'ici une minute." })
    } catch (e) { toast.error("Enregistrement impossible", { description: (e as Error).message }) } finally { setBusy(false) }
  }
  const expired = !!c.ends_at && new Date(c.ends_at) <= new Date()

  return (
    <div className="flex flex-col gap-y-3">
      <Container className="divide-y p-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <Heading>Offre en cours</Heading>
            <Text size="small" className="text-ui-fg-subtle">Bandeau affiché en haut de toutes les pages de la boutique.</Text>
          </div>
          <Button size="small" onClick={save} isLoading={busy}>Enregistrer</Button>
        </div>
        <div className="flex flex-col gap-y-4 px-6 py-5">
          <div className="flex items-center justify-between">
            <Label htmlFor="active" weight="plus">Bandeau actif</Label>
            <Switch id="active" checked={c.active} onCheckedChange={(v) => setC({ ...c, active: v })} />
          </div>
          <div className="flex flex-col gap-y-1">
            <Label htmlFor="text" weight="plus">Texte (120 caractères max.)</Label>
            <Input id="text" maxLength={120} value={c.text} placeholder="Black Friday : −20 % sur une sélection jusqu'à lundi minuit" onChange={(e) => setC({ ...c, text: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="link" weight="plus">Lien (facultatif)</Label>
              <Input id="link" value={c.link ?? ""} placeholder="/baskets-femme" onChange={(e) => setC({ ...c, link: e.target.value })} />
              <Text size="xsmall" className="text-ui-fg-subtle">Page de la boutique, commençant par /</Text>
            </div>
            <div className="flex flex-col gap-y-1">
              <Label htmlFor="end" weight="plus">Fin de l'offre (facultatif)</Label>
              <Input id="end" type="datetime-local" value={toLocal(c.ends_at)} onChange={(e) => setC({ ...c, ends_at: e.target.value ? new Date(e.target.value).toISOString() : null })} />
              <Text size="xsmall" className={expired ? "text-ui-fg-error" : "text-ui-fg-subtle"}>{expired ? "Date passée : le bandeau n'est plus affiché." : "Le bandeau disparaît tout seul à cette date."}</Text>
            </div>
          </div>
          <div>
            <Text size="small" weight="plus" className="mb-2">Aperçu</Text>
            <div className="rounded-md bg-[#1f4fff] px-4 py-2.5 text-center text-sm font-semibold uppercase tracking-wider text-white" style={{ opacity: c.active && !expired ? 1 : 0.4 }}>
              {c.text || "Votre texte d'offre"}{c.link ? " →" : ""}
            </div>
          </div>
        </div>
      </Container>
      <Container className="px-6 py-4">
        <Heading level="h2">Mettre en place les remises</Heading>
        <ul className="text-ui-fg-subtle mt-2 list-disc space-y-1 pl-5 text-sm">
          <li><a className="text-ui-fg-interactive" href="/app/price-lists">Price Lists</a> : créez une liste de type « Sale » avec dates de début et de fin et les prix soldés. La boutique affiche alors le prix barré et le badge « −X % ».</li>
          <li><a className="text-ui-fg-interactive" href="/app/promotions">Promotions</a> : créez un code promo (ex. NOEL10), saisi par le client dans son panier.</li>
          <li><strong>Règle des 30 jours</strong> (art. L112-1-1 Code de la consommation) : le prix barré affiché est automatiquement le plus bas des 30 derniers jours, relevé chaque nuit. N'augmentez pas vos prix juste avant une offre : le prix barré n'en tiendrait pas compte.</li>
          <li>Le mot « soldes » est réservé aux périodes officielles (soldes d'hiver et d'été). Pour le Black Friday, parlez d'« offre » ou de « promotion ».</li>
        </ul>
      </Container>
    </div>
  )
}

export const config = defineRouteConfig({ label: "Offre en cours", icon: Tag })

export default OffrePage
