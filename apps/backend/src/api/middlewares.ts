import { defineMiddlewares, validateAndTransformBody } from "@medusajs/framework/http"
import type { MedusaNextFunction, MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { createLimiter } from "../lib/rate-limit"

const limiter = createLimiter(10, 60_000) // 10 requêtes / minute / IP sur les formulaires publics

const rateLimit = (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  const ip = (req.headers["x-forwarded-for"] as string | undefined)?.split(",")[0]?.trim() || req.ip || "unknown"
  const r = limiter(ip)
  if (!r.allowed) {
    res.setHeader("Retry-After", String(r.retryAfterSec))
    res.status(429).json({ message: "Trop de requêtes, réessayez dans un instant." })
    return
  }
  next()
}

export const StartWithdrawalSchema = z.object({
  order_display_id: z.number().int().positive(),
  email: z.string().email().max(254),
  scope: z.enum(["full", "partial"]).default("full"),
  item_ids: z.array(z.string().max(64)).max(50).optional(),
})

export const ConfirmWithdrawalSchema = z.object({
  id: z.string().max(64),
  email: z.string().email().max(254),
})

export const ShipSupplierOrderSchema = z.object({
  tracking_number: z.string().trim().min(3).max(100),
  carrier: z.string().trim().max(100).optional(),
})

const SupplierFields = {
  name: z.string().trim().min(2).max(120),
  country: z.string().trim().length(2).transform((c) => c.toLowerCase()), // pays de l'entrepôt d'expédition (ISO 2 lettres)
  email: z.string().trim().email().max(254),
  vat_number: z.string().trim().max(40).nullish(),
  lead_time_days: z.number().int().min(0).max(90),
  ships_from_eu: z.boolean(),
  written_agreement_ref: z.string().trim().max(200).nullish(),
  integration: z.enum(["email", "cj"]),
  logistic_name: z.string().trim().max(100).nullish(),
  active: z.boolean(),
}
// CJ exige un transporteur ; sans lui la transmission échouerait à chaque commande.
const needsCarrier = (v: { integration?: string; logistic_name?: string | null }) => v.integration !== "cj" || !!v.logistic_name
export const CreateSupplierSchema = z.object(SupplierFields).refine(needsCarrier, { message: "Transporteur CJ obligatoire", path: ["logistic_name"] })
export const UpdateSupplierSchema = z.object(SupplierFields).partial()

export const ProductSupplierSchema = z.object({
  supplier_id: z.string().max(64).nullable(), // null = produit sans fournisseur
  variants: z.array(z.object({
    id: z.string().max(64),
    supplier_sku: z.string().trim().max(64).nullish(),
    supplier_cost_cents: z.number().int().min(0).max(10_000_000).nullish(),
  })).max(500),
})

export default defineMiddlewares({
  routes: [
    { matcher: "/admin/suppliers", method: "POST", middlewares: [validateAndTransformBody(CreateSupplierSchema)] },
    { matcher: "/admin/suppliers/:id", method: "POST", middlewares: [validateAndTransformBody(UpdateSupplierSchema)] },
    { matcher: "/admin/products/:id/supplier", method: "POST", middlewares: [validateAndTransformBody(ProductSupplierSchema)] },
    { matcher: "/admin/supplier-orders/:id/ship", method: "POST", middlewares: [validateAndTransformBody(ShipSupplierOrderSchema)] },
    { matcher: "/store/withdrawals/start", method: "POST", middlewares: [rateLimit, validateAndTransformBody(StartWithdrawalSchema)] },
    { matcher: "/store/withdrawals/confirm", method: "POST", middlewares: [rateLimit, validateAndTransformBody(ConfirmWithdrawalSchema)] },
  ],
})
