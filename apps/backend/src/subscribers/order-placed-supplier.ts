import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { createSupplierOrdersForOrder, dispatchSupplierOrder } from "../lib/supplier-dispatch"

// Dropshipping : à chaque commande payée, une commande par fournisseur, transmise aussitôt (API CJ ou e-mail).
// Un échec n'interrompt rien côté client : la commande fournisseur reste « à passer » et se relance depuis l'admin.
export default async function supplierOrderPlaced({ event, container }: SubscriberArgs<{ id: string }>) {
  const ids = await createSupplierOrdersForOrder(container, event.data.id)
  for (const id of ids) await dispatchSupplierOrder(container, id)
}

export const config: SubscriberConfig = { event: "order.placed", context: { subscriberId: "supplier-order-placed" } }
