import type { Metadata } from "next"
import { LegalDraft } from "@/components/legal-draft"

export const metadata: Metadata = { title: "Médiateur de la consommation", robots: { index: false } }

export default function Page() {
  return <LegalDraft title="Médiateur de la consommation" />
}
