import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "zod"
import { SUPPLIER_MODULE } from "../../../modules/supplier"
import type SupplierModuleService from "../../../modules/supplier/service"
import type { CreateSupplierSchema } from "../../middlewares"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  const suppliers = await svc.listSuppliers({}, { order: { name: "ASC" }, take: 200 })
  res.json({ suppliers })
}

export async function POST(req: MedusaRequest<z.infer<typeof CreateSupplierSchema>>, res: MedusaResponse) {
  const svc: SupplierModuleService = req.scope.resolve(SUPPLIER_MODULE)
  const supplier = await svc.createSuppliers(req.validatedBody)
  res.status(201).json({ supplier })
}
