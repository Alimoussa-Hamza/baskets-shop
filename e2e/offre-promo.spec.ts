import { expect, test } from "@playwright/test"

// Offre en cours : prix barré cohérent et code promo, avec un récapitulatif de panier qui « tombe juste ».
// Données de démo : liste de prix « Black Friday (démo) » et code NOEL10 (créés dans l'admin). Sans elles, le test
// vérifie seulement l'arithmétique du panier.
test.beforeEach(({}, info) => test.skip(info.project.name !== "ordinateur", "un seul appareil suffit"))

const euros = (s: string | null) => Number((s ?? "").replace(/[^\d,]/g, "").replace(",", "."))

test("prix barré conforme et code promo : le récapitulatif du panier est exact", async ({ page }) => {
  await page.goto("/baskets-rehaussantes/basses/baskets-rehaussantes-cuir-homme")
  const struck = page.locator("main s").first()
  if (await struck.isVisible()) {
    const ref = euros(await struck.textContent())
    const now = euros(await struck.locator("xpath=following-sibling::span[1]").textContent())
    expect(now).toBeLessThan(ref) // jamais de « réduction » vers un prix plus haut
    await expect(page.getByText("prix le plus bas pratiqué sur les 30 derniers jours")).toBeVisible()
  }
  const shown = euros(await page.locator("main p.text-2xl > span").first().textContent()) // prix payé avant code promo
  await page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first().click()
  await page.getByRole("button", { name: /ajouter au panier/i }).click()
  await expect(page).toHaveURL(/\/panier$/)

  await page.getByRole("button", { name: /Code promotionnel/ }).click()
  await page.getByLabel("Code promotionnel").fill("NOEL10")
  await page.getByRole("button", { name: "Appliquer" }).click()
  // Attendre le récapitulatif recalculé (réduction affichée ou code refusé), pas un délai fixe
  await expect(page.getByRole("complementary", { name: "Récapitulatif" }).getByText("Réduction").or(page.getByText("Ce code n'est pas valide."))).toBeVisible({ timeout: 20_000 })

  const summary = page.getByRole("complementary", { name: "Récapitulatif" })
  const line = async (label: string) => euros(await summary.locator("div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd").textContent().catch(() => "0"))
  const sub = await line("Sous-total")
  const discount = (await summary.getByText("Réduction").isVisible()) ? await line("Réduction") : 0
  const shipping = await line("Livraison")
  const total = euros(await summary.getByText(/Total TTC/).locator("..").locator("span").last().textContent())
  expect(sub).toBe(shown) // sous-total AVANT remise = prix de la fiche (1 paire)
  if (discount) expect(discount).toBeCloseTo(shown * 0.1, 2) // NOEL10 = 10 %
  expect(Math.round((sub - discount + shipping) * 100)).toBe(Math.round(total * 100))
})
