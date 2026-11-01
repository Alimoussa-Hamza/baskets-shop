import { MedusaService } from "@medusajs/framework/utils"
import Supplier from "./models/supplier"
import SupplierOrder from "./models/supplier-order"
import SupplierVariant from "./models/supplier-variant"

class SupplierModuleService extends MedusaService({ Supplier, SupplierOrder, SupplierVariant }) {}

export default SupplierModuleService
