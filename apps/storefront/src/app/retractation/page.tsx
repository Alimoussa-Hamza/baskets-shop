import type { Metadata } from "next"
import { WithdrawalForm } from "@/components/withdrawal-form"

export const metadata: Metadata = { title: "Renoncer au contrat (rétractation)", robots: { index: false } }

export default function RetractationPage() {
  return (
    <section className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold">Renoncer au contrat (rétractation)</h1>
      <p>Vous disposez de 14 jours pour vous rétracter, sans avoir à vous justifier. Aucun compte n est nécessaire.</p>
      <WithdrawalForm />
    </section>
  )
}
