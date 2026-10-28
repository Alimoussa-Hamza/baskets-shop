import type { Metadata } from "next"
import { LegalDraft } from "@/components/legal-draft"

export const metadata: Metadata = { title: "Conditions générales de vente", robots: { index: false } }

export default function Page() {
  return <LegalDraft title="Conditions générales de vente" />
}
