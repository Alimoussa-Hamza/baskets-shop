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

export default defineMiddlewares({
  routes: [
    { matcher: "/store/withdrawals/start", method: "POST", middlewares: [rateLimit, validateAndTransformBody(StartWithdrawalSchema)] },
    { matcher: "/store/withdrawals/confirm", method: "POST", middlewares: [rateLimit, validateAndTransformBody(ConfirmWithdrawalSchema)] },
  ],
})
