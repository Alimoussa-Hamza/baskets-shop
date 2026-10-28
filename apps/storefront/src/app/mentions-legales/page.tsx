import type { Metadata } from "next"
import { LegalDraft } from "@/components/legal-draft"

export const metadata: Metadata = { title: "Mentions légales", robots: { index: false } }

export default function Page() {
  return <LegalDraft title="Mentions légales" />
}
