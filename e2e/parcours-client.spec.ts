import { expect, test, type Page } from "@playwright/test"

// Parcours complet d'un client : cookies, catalogue, panier, commande (paiement de test), e-mails, rétractation.
// Prérequis : NEXT_PUBLIC_TEST_PAYMENT=1 côté storefront, SMTP vers Mailpit côté backend.
// Optionnel : ADMIN_EMAIL + ADMIN_PASSWORD pour vérifier la transmission au fournisseur (dropshipping).
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025"
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:9000"

async function waitForMail(to: string, subject: RegExp): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`).then((r) => r.json())
    const m = (r.messages ?? []).find((x: { Subject: string }) => subject.test(x.Subject))
    if (m) return m.Subject
    await new Promise((s) => setTimeout(s, 1000))
  }
  throw new Error(`aucun e-mail « ${subject} » reçu par ${to}`)
}

const price = (s: string) => Number(s.replace(/[^\d,]/g, "").replace(",", "."))

async function openFilters(page: Page) {
  const opener = page.getByRole("button", { name: /^Filtres/ })
  if (await opener.isVisible()) {
    await opener.click()
    return page.getByRole("dialog", { name: "Filtres" })
  }
  return page.getByRole("complementary", { name: "Filtres" })
}

test("parcours client complet", async ({ page }, info) => {
  const email = `client.${info.project.name}.${Date.now()}@example.com`
  const jsErrors: string[] = []
  page.on("pageerror", (e) => jsErrors.push(e.message))
  let orderNo = ""

  await test.step("bandeau cookies : « Tout refuser » le ferme durablement", async () => {
    await page.goto("/")
    await expect(page.getByRole("heading", { name: "Vos choix sur les cookies" })).toBeVisible()
    await page.getByRole("button", { name: "Tout refuser" }).click()
    await page.reload()
    await expect(page.getByRole("heading", { name: "Vos choix sur les cookies" })).toBeHidden()
  })

  await test.step("catalogue : menu, filtre taille, tri par prix", async () => {
    const burger = page.getByRole("button", { name: "Ouvrir le menu" }) // téléphone : menu latéral
    if (await burger.isVisible()) {
      await burger.click()
      await page.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Femme", exact: true }).click()
    } else await page.getByRole("banner").getByRole("link", { name: /femme/i }).first().click()
    await expect(page.getByRole("heading", { level: 1, name: "Baskets femme" })).toBeVisible()
    const filters = await openFilters(page)
    await filters.getByRole("button", { name: "38", exact: true }).click()
    const close = filters.getByRole("button", { name: /^Voir/ })
    if (await close.isVisible()) await close.click()
    await expect(page.getByRole("button", { name: "Retirer le filtre Taille 38" })).toBeVisible()
    await page.getByRole("combobox").selectOption("prix-asc")
    const prices = (await page.locator("article p.whitespace-nowrap").allTextContents()).map(price)
    expect(prices.length).toBeGreaterThan(0)
    expect(prices).toEqual([...prices].sort((a, b) => a - b))
  })

  await test.step("fiche produit : pointure obligatoire, puis ajout au panier", async () => {
    await page.locator("article a").first().click()
    await expect(page).toHaveURL(/\/baskets-femme\/[^/]+\/[^/]+$/)
    await page.getByRole("button", { name: /ajouter au panier/i }).click()
    await expect(page.getByRole("alert").filter({ hasText: "Choisissez une taille" })).toBeVisible()
    // Pointure en stock confortable : le panier teste ensuite +1 paire (chaque exécution consomme du stock local)
    await page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first().click()
    await page.getByRole("button", { name: /ajouter au panier/i }).click()
    await expect(page).toHaveURL(/\/panier$/) // l'ajout redirige vers le panier
  })

  await test.step("panier : la quantité met le total à jour", async () => {
    const total = page.getByText(/Total TTC/).locator("..")
    const before = await total.textContent()
    await page.getByRole("button", { name: "Ajouter une paire" }).first().click()
    await expect(total).not.toHaveText(before!)
    await page.getByRole("button", { name: "Retirer une paire" }).first().click()
    await expect(total).toHaveText(before!)
  })

  await test.step("checkout : erreurs, coordonnées, livraison", async () => {
    await page.getByRole("link", { name: "Commander" }).or(page.getByRole("button", { name: "Commander" })).first().click()
    await expect(page).toHaveURL(/\/commande$/)
    await page.getByRole("button", { name: /continuer vers la livraison/i }).click()
    await expect(page.getByRole("button", { name: /continuer vers le paiement/i })).toBeHidden()
    await page.getByLabel("Adresse e-mail").fill(email)
    await page.getByLabel("Prénom").fill("Camille")
    await page.getByLabel("Nom", { exact: true }).fill("Test")
    await page.getByLabel("Adresse de livraison").fill("10 rue de la Paix")
    await page.getByLabel("Code postal").fill("75002")
    await page.getByLabel("Ville").fill("Paris")
    await page.getByRole("button", { name: /continuer vers la livraison/i }).click()
    await page.getByRole("button", { name: /continuer vers le paiement/i }).click()
  })

  await test.step("paiement : refusé sans CGV, accepté avec", async () => {
    // Choix « Paiement factice » présent quand Stripe est aussi configuré ; sinon seul le mode test s'affiche
    const fake = page.getByRole("radio", { name: /Paiement factice/ })
    await expect(fake.or(page.getByRole("note").filter({ hasText: "Mode test" }))).toBeVisible()
    if (await fake.isVisible()) await fake.check()
    const pay = page.getByRole("button", { name: /commander avec obligation de paiement/i })
    await pay.click()
    await expect(page.getByRole("alert").filter({ hasText: "conditions générales de vente" })).toBeVisible()
    await page.getByRole("checkbox").check()
    await pay.click()
    await expect(page).toHaveURL(/confirmation/, { timeout: 20_000 })
    orderNo = (await page.locator("main").textContent())?.match(/n[°o]\s*(\d+)/i)?.[1] ?? ""
    expect(orderNo, "numéro de commande affiché").not.toBe("")
    await page.goto("/panier")
    await expect(page.getByText("Votre panier est vide")).toBeVisible()
  })

  await test.step("e-mail de confirmation reçu", async () => {
    expect(await waitForMail(email, /Confirmation de votre commande/)).toContain(orderNo)
  })

  await test.step("dropshipping : commande transmise au fournisseur", async () => {
    // Sans identifiants admin, seule cette vérification est sautée (test.skip sauterait tout le parcours)
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
      info.annotations.push({ type: "skip", description: "transmission fournisseur non vérifiée : ADMIN_EMAIL / ADMIN_PASSWORD non fournis" })
      return
    }
    const auth = await fetch(`${BACKEND}/auth/user/emailpass`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
    }).then((r) => r.json())
    await expect.poll(async () => {
      const r = await fetch(`${BACKEND}/admin/supplier-orders`, { headers: { Authorization: `Bearer ${auth.token}` } }).then((r) => r.json())
      return r.supplier_orders.find((o: { order_display_id: number }) => String(o.order_display_id) === orderNo)?.status
    }, { timeout: 15_000 }).toBe("placed")
  })

  await test.step("rétractation en 2 étapes + accusé par e-mail", async () => {
    await page.goto("/retractation")
    await page.getByLabel("Numéro de commande").fill(orderNo)
    await page.getByLabel("E-mail utilisé pour la commande").fill(email)
    await page.getByRole("button", { name: "Continuer" }).click()
    await page.getByRole("button", { name: "Confirmer la rétractation" }).click()
    await expect(page.getByRole("heading", { name: "Rétractation enregistrée" })).toBeVisible()
    expect(await waitForMail(email, /rétractation/i)).toContain(orderNo)
  })

  await test.step("calculateur de pointure", async () => {
    await page.goto("/guide-des-tailles")
    await page.getByLabel("Longueur du pied (cm)").fill("27,5")
    await page.getByRole("button", { name: "Calculer" }).click()
    await expect(page.getByText(/Pointure conseillée : \d{2}/)).toBeVisible()
  })

  await test.step("page inexistante : 404", async () => {
    const r = await page.goto("/nexiste-pas")
    expect(r?.status()).toBe(404)
  })

  expect(jsErrors, "aucune erreur JavaScript").toEqual([])
})
