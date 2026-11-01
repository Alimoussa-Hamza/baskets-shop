import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { SUPPLIER_MODULE } from "../../../../modules/supplier"
import type SupplierModuleService from "../../../../modules/supplier/service"
import { searchCjProducts } from "../../../../lib/cj"
import { blockedBrand } from "../../../../lib/cj-catalog"
import { cjOptions } from "../../../../lib/cj-import"

// Recherche dans le catalogue CJ, limitée au stock de l'entrepôt du fournisseur choisi (ex. DE).
// Prix indicatifs : coût de la variante la moins chère ; le détail exact vient de l'aperçu.
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = String(req.query.q ?? "").trim().slice(0, 80)
  const supplier = await (req.scope.resolve(SUPPLIER_MODULE) as SupplierModuleService).retrieveSupplier(String(req.query.supplier_id ?? ""))
  if (!q) { res.json({ total: 0, products: [] }); return }
  try {
    const page = Math.min(Math.max(Number(req.query.page) || 1, 1), 50)
    const r = await searchCjProducts({ keyWord: q, countryCode: supplier.country.toUpperCase(), page })
    const { usdToEur } = cjOptions(supplier.country)
    res.json({
      total: r.total,
      products: r.products.map((p) => ({
        pid: p.id, name: p.nameEn, image: p.bigImage, stock: p.warehouseInventoryNum ?? null, listed: p.listedNum ?? null,
        cost_eur: Math.round(Number(String(p.sellPrice).split("--")[0]) * usdToEur * 100) / 100 || null, // « 12.5--18.9 » = fourchette
        blocked_brand: blockedBrand(p.nameEn),
      })),
    })
  } catch (e) { res.status(502).json({ type: "cj_error", message: (e as Error).message }) }
}
