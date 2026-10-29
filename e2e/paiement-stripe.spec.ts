import { expect, test, type Page } from "@playwright/test"

// Paiement réel en MODE TEST Stripe (cartes de test officielles). Ignoré si Stripe n'est pas configuré.
// Prérequis : clés de test dans les .env, `stripe listen --forward-to localhost:9000/hooks/payment/stripe_stripe`.
test.describe.configure({ mode: "serial" })
test.use({ viewport: { width: 1280, height: 900 } })
test.beforeEach(({}, info) => test.skip(info.project.name !== "ordinateur", "un seul appareil suffit pour Stripe"))

async function toPayment(page: Page, email: string) {
  await page.goto("/")
  const refuse = page.getByRole("button", { name: "Tout refuser" })
  if (await refuse.isVisible()) await refuse.click()
  await page.goto("/baskets-homme")
  await page.locator("article a").first().click()
  await page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first().click()
  await page.getByRole("button", { name: /ajouter au panier/i }).click()
  await expect(page).toHaveURL(/\/panier$/)
  await page.getByRole("link", { name: "Commander" }).or(page.getByRole("button", { name: "Commander" })).first().click()
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByLabel("Prénom").fill("Camille")
  await page.getByLabel("Nom", { exact: true }).fill("Stripe")
  await page.getByLabel("Adresse de livraison").fill("10 rue de la Paix")
  await page.getByLabel("Code postal").fill("75002")
  await page.getByLabel("Ville").fill("Paris")
  await page.getByRole("button", { name: /continuer vers la livraison/i }).click()
  await page.getByRole("button", { name: /continuer vers le paiement/i }).click()
  const card = page.getByRole("radio", { name: /Carte bancaire/ })
  const hasStripe = await card.waitFor({ timeout: 10_000 }).then(() => true, () => false)
  test.skip(!hasStripe, "Stripe non configuré (clé publiable absente)")
  await card.check()
  await expect(page.frameLocator('iframe[title*="paiement"], iframe[title*="payment"]').first().locator('input[name="number"]')).toBeVisible({ timeout: 20_000 })
}

async function fillCard(page: Page, number: string) {
  const frame = page.frameLocator('iframe[title*="paiement"], iframe[title*="payment"]').first()
  await frame.locator('input[name="number"]').fill(number)
  await frame.locator('input[name="expiry"]').fill("12 / 34")
  await frame.locator('input[name="cvc"]').fill("123")
  await page.getByRole("checkbox").check()
}

test("carte acceptée (4242) → commande créée", async ({ page }) => {
  await toPayment(page, `stripe.ok.${Date.now()}@example.com`)
  await fillCard(page, "4242 4242 4242 4242")
  await page.getByRole("button", { name: /commander avec obligation de paiement/i }).click()
  await expect(page).toHaveURL(/confirmation/, { timeout: 30_000 })
  await expect(page.getByText(/Votre commande n° \d+/)).toBeVisible()
})

test("carte refusée (…0002) → message, aucune commande", async ({ page }) => {
  await toPayment(page, `stripe.refus.${Date.now()}@example.com`)
  await fillCard(page, "4000 0000 0000 0002")
  await page.getByRole("button", { name: /commander avec obligation de paiement/i }).click()
  await expect(page.getByRole("alert").filter({ hasText: /refus|declin/i })).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/commande$/)
})

test("3D Secure (…3184) validé → commande créée", async ({ page }) => {
  await toPayment(page, `stripe.3ds.${Date.now()}@example.com`)
  await fillCard(page, "4000 0027 6000 3184")
  await page.getByRole("button", { name: /commander avec obligation de paiement/i }).click()
  // Page d'authentification de test Stripe : cadres imbriqués, on cherche le bouton « Complete » dans chacun
  await expect.poll(async () => {
    for (const f of page.frames()) {
      const btn = f.getByRole("button", { name: /^complete$/i })
      if (await btn.isVisible().catch(() => false)) { await btn.click(); return true }
    }
    return false
  }, { timeout: 30_000 }).toBe(true)
  await expect(page).toHaveURL(/confirmation/, { timeout: 30_000 })
})

test("panier modifié dans un autre onglet pendant le paiement → aucun débit, nouveau montant, puis commande complète", async ({ page }) => {
  await toPayment(page, `stripe.onglets.${Date.now()}@example.com`)
  const pay = page.getByRole("button", { name: /commander avec obligation de paiement/i })
  const before = (await pay.textContent())!.trim()
  // Autre onglet, même panier : ajout d'une 2e paire
  const other = await page.context().newPage()
  await other.goto("/baskets-femme/urbaines/white-essence")
  await other.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first().click()
  await other.getByRole("button", { name: /ajouter au panier/i }).click()
  await expect(other).toHaveURL(/\/panier$/)
  await other.close()
  // L'ancien formulaire refuse de payer l'ancien montant
  await fillCard(page, "4242 4242 4242 4242")
  await pay.click()
  await expect(page.getByRole("alert").filter({ hasText: "panier a été modifié" })).toBeVisible({ timeout: 30_000 })
  await expect(page).toHaveURL(/\/commande$/)
  // Formulaire rechargé au nouveau montant, puis paiement accepté
  await expect(pay).not.toHaveText(before, { timeout: 20_000 })
  const frame = page.frameLocator('iframe[title*="paiement"], iframe[title*="payment"]').first()
  await frame.locator('input[name="number"]').fill("4242 4242 4242 4242")
  await frame.locator('input[name="expiry"]').fill("12 / 34")
  await frame.locator('input[name="cvc"]').fill("123")
  await pay.click()
  await expect(page).toHaveURL(/confirmation/, { timeout: 30_000 })
  await expect(page.locator("main")).toContainText("White Essence")
})
