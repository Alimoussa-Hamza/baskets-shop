import type { Metadata } from "next"
import { LegalDraft } from "@/components/legal-draft"

export const metadata: Metadata = { title: "Politique de cookies", robots: { index: false } }

export default function Page() {
  return <LegalDraft title="Politique de cookies" />
}
