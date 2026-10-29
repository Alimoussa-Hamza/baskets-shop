import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { SUPPLIER_MODULE } from "../../../modules/supplier"
import type SupplierModuleService from "../../../modules/supplier/service"

// Liste des commandes fournisseur (100 plus récentes), avec le n° de commande boutique.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  const status = typeof req.query.status === "string" ? req.query.status : undefined
  const rows = await svc.listSupplierOrders(status ? { status: status as never } : {}, { relations: ["supplier"], order: { created_at: "DESC" }, take: 100 })
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const ids = [...new Set(rows.map((r) => r.order_id))]
  const { data: orders } = ids.length ? await query.graph({ entity: "order", fields: ["id", "display_id"], filters: { id: ids } }) : { data: [] }
  const displayIds = new Map(orders.map((o) => [o.id, Number(o.display_id)]))
  res.json({
    supplier_orders: rows.map((r) => ({
      id: r.id, status: r.status, order_id: r.order_id, order_display_id: displayIds.get(r.order_id) ?? null,
      supplier: { id: r.supplier.id, name: r.supplier.name, integration: r.supplier.integration },
      supplier_reference: r.supplier_reference, tracking_number: r.tracking_number, carrier: r.carrier,
      cost_total_cents: r.cost_total_cents, lines: (r.lines as { lines?: unknown[] } | null)?.lines ?? [],
      last_error: r.last_error, placed_at: r.placed_at, shipped_at: r.shipped_at, created_at: r.created_at,
    })),
  })
}
