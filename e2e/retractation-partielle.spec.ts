import { expect, test, type Page } from "@playwright/test"

// Rétractation partielle : commande de 2 articles, renonciation à 1, puis au reste (l'article déjà rétracté est signalé).
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025"

test.beforeEach(({}, info) => test.skip(info.project.name !== "ordinateur", "un seul appareil suffit"))

async function mailText(to: string, subject: RegExp): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`).then((r) => r.json())
    const m = (r.messages ?? []).filter((x: { Subject: string }) => subject.test(x.Subject))
    if (m.length) return (await fetch(`${MAILPIT}/api/v1/message/${m[0].ID}`).then((r) => r.json())).Text as string
    await new Promise((s) => setTimeout(s, 1000))
  }
  throw new Error(`aucun e-mail « ${subject} » pour ${to}`)
}

async function addPair(page: Page, url: string) {
  await page.goto(url)
  await page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first().click()
  await page.getByRole("button", { name: /ajouter au panier/i }).click()
  await expect(page).toHaveURL(/\/panier$/)
}

test("renoncer à un article sur deux, puis au reste", async ({ page }) => {
  const email = `retract.partiel.${Date.now()}@example.com`
  await page.goto("/")
  const refuse = page.getByRole("button", { name: "Tout refuser" })
  if (await refuse.isVisible()) await refuse.click()

  await addPair(page, "/baskets-homme/urbaines/heritage-black")
  await addPair(page, "/baskets-homme/running/stride-run")
  await page.getByRole("link", { name: "Commander" }).or(page.getByRole("button", { name: "Commander" })).first().click()
  await page.getByLabel("Adresse e-mail").fill(email)
  await page.getByLabel("Prénom").fill("Camille")
  await page.getByLabel("Nom", { exact: true }).fill("Partiel")
  await page.getByLabel("Adresse de livraison").fill("10 rue de la Paix")
  await page.getByLabel("Code postal").fill("75002")
  await page.getByLabel("Ville").fill("Paris")
  await page.getByRole("button", { name: /continuer vers la livraison/i }).click()
  await page.getByRole("button", { name: /continuer vers le paiement/i }).click()
  const fake = page.getByRole("radio", { name: /Paiement factice/ })
  await expect(fake.or(page.getByRole("note").filter({ hasText: "Mode test" }))).toBeVisible()
  if (await fake.isVisible()) await fake.check()
  await page.getByRole("checkbox").check()
  await page.getByRole("button", { name: /commander avec obligation de paiement/i }).click()
  await expect(page).toHaveURL(/confirmation/, { timeout: 20_000 })
  const orderNo = (await page.locator("main").textContent())?.match(/n[°o]\s*(\d+)/i)?.[1] ?? ""
  expect(orderNo).not.toBe("")

  const identify = async () => {
    await page.goto("/retractation")
    await page.getByLabel("Numéro de commande").fill(orderNo)
    await page.getByLabel("E-mail utilisé pour la commande").fill(email)
    await page.getByRole("button", { name: "Continuer" }).click()
    await expect(page.getByRole("heading", { name: "Étape 2 sur 2 : confirmer" })).toBeVisible()
  }

  await test.step("1re demande : seulement Heritage Black", async () => {
    await identify()
    await page.getByRole("radio", { name: /Certains articles/ }).check()
    await expect(page.getByRole("button", { name: "Confirmer la rétractation" })).toBeDisabled()
    await page.getByRole("checkbox", { name: /Heritage Black/ }).check()
    await page.getByRole("button", { name: "Confirmer la rétractation" }).click()
    const status = page.getByRole("status")
    await expect(status.getByRole("heading", { name: "Rétractation enregistrée" })).toBeVisible()
    await expect(status).toContainText("Heritage Black")
    await expect(status).not.toContainText("Stride Run")
    const mail = await mailText(email, /rétractation/i)
    expect(mail).toContain("Heritage Black")
    expect(mail).not.toContain("Stride Run")
  })

  await test.step("2e demande : Heritage Black signalé, « toute la commande » = Stride Run seul", async () => {
    await identify()
    await expect(page.getByText("Déjà rétracté")).toHaveCount(1)
    await expect(page.getByText("1 article", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Confirmer la rétractation" }).click()
    const status = page.getByRole("status")
    await expect(status).toContainText("Stride Run")
    await expect(status).not.toContainText("Heritage Black")
  })

  await test.step("3e demande : tout est déjà rétracté", async () => {
    await identify()
    await expect(page.getByText("Une rétractation a déjà été enregistrée pour tous les articles")).toBeVisible()
  })
})
