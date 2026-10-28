import type { Metadata } from "next"
import { LegalDraft } from "@/components/legal-draft"

export const metadata: Metadata = { title: "Livraison et retours", robots: { index: false } }

export default function Page() {
  return <LegalDraft title="Livraison et retours" />
}
