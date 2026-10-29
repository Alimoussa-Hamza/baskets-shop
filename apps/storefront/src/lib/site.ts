export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:8000"
export const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? "http://localhost:9000"
export const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? ""
export const SITE_NAME = "SNEAKR" // placeholder des maquettes : nom de marque à valider (INPI / EUIPO) avant tout achat de domaine
export const FREE_SHIPPING_THRESHOLD = 150 // € TTC – seuil des maquettes, décision commerciale à confirmer
// Paiement factice (fournisseur « system default » de Medusa) : JAMAIS en production.
export const TEST_PAYMENT = process.env.NODE_ENV !== "production" && process.env.NEXT_PUBLIC_TEST_PAYMENT === "1"
// Paiement par carte : actif dès que la clé publiable Stripe est fournie (clés TEST hors production).
export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? ""
export const STRIPE_PROVIDER = "pp_stripe_stripe"
