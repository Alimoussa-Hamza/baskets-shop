import type { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

// Commande factice pour tester la rétractation en local. Usage :
//   npx medusa exec ./src/scripts/seed-test-order.ts
// Refuse de tourner en production.
export default async function seedTestOrder({ container }: ExecArgs) {
  if (process.env.NODE_ENV === "production") throw new Error("Interdit en production")
  const orderModule = container.resolve(Modules.ORDER)
  const order = await orderModule.createOrders({
    currency_code: "eur",
    email: "client.test@example.com",
    items: [
      { title: "Basket Running Test - 41 - Noir", quantity: 1, unit_price: 7083 },
      { title: "Basket Urbaine Test - 38 - Blanc", quantity: 1, unit_price: 6500 },
    ],
  })
  container.resolve("logger").info(`Commande de test créée : n°${order.display_id} (client.test@example.com)`)
}
