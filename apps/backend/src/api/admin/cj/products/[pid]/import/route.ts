import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import type { z } from "zod"
import { importCjProduct } from "../../../../../../lib/cj-import"
import type { CjImportSchema } from "../../../../../middlewares"

export async function POST(req: MedusaRequest<z.infer<typeof CjImportSchema>>, res: MedusaResponse) {
  try {
    res.json(await importCjProduct(req.scope, { pid: req.params.pid, ...req.validatedBody }))
  } catch (e) { res.status(400).json({ type: "import_error", message: (e as Error).message }) }
}
