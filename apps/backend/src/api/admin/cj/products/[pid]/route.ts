import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { previewCjProduct } from "../../../../../lib/cj-import"

// Aperçu de l'import : variantes retenues (pointure, couleur, stock, coût, prix de vente) et variantes écartées.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const { plan, shipping, alreadyImported } = await previewCjProduct(req.scope, req.params.pid, String(req.query.supplier_id ?? ""))
    res.json({ plan, shipping, already_imported: alreadyImported })
  } catch (e) { res.status(502).json({ type: "cj_error", message: (e as Error).message }) }
}
