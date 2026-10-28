import { MedusaService } from "@medusajs/framework/utils"
import Supplier from "./models/supplier"
import SupplierOrder from "./models/supplier-order"

class SupplierModuleService extends MedusaService({ Supplier, SupplierOrder }) {}

export default SupplierModuleService
