import { devices, expect, test, type Browser, type BrowserContext, type Locator, type Page } from "@playwright/test"

// Exécution du cahier de tests docs/qa/CAHIER-DE-TESTS.md : un test par identifiant, dans l'ordre d'un vrai client,
// sur un seul navigateur (même panier du début à la fin). Curseur visible, frappe au clavier : à regarder en direct
// (`npm run qa`) ou en vidéo dans le rapport (`npm run qa:report`). Crée de vraies commandes dans la base LOCALE.
const MAILPIT = process.env.MAILPIT_URL ?? "http://localhost:8025"
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:9000"
const GENRE = "/baskets-rehaussantes"
const CUIR = `${GENRE}/basses/baskets-rehaussantes-cuir-homme`
const DAIM = `${GENRE}/basses/baskets-rehaussantes-aspect-daim-homme`
const EPAISSE = `${GENRE}/basses/baskets-rehaussantes-semelle-epaisse-homme`

// Curseur rouge qui suit la souris (la souris de Playwright est invisible) + bandeau du cas en cours ; survit aux navigations
const OVERLAY = () => {
  const add = () => {
    if (document.getElementById("qa-cursor")) return
    const c = document.createElement("div"); c.id = "qa-cursor"
    c.style.cssText = "position:fixed;z-index:2147483647;width:24px;height:24px;margin:-12px 0 0 -12px;border-radius:50%;background:rgba(230,30,30,.55);border:2px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.5);pointer-events:none;transition:transform .12s"
    const pos = JSON.parse(sessionStorage.getItem("qa-pos") ?? "[-40,-40]"); c.style.left = pos[0] + "px"; c.style.top = pos[1] + "px"
    const cap = document.createElement("div"); cap.id = "qa-caption"; cap.textContent = sessionStorage.getItem("qa-caption") ?? ""
    cap.style.cssText = "position:fixed;z-index:2147483646;left:8px;bottom:8px;padding:6px 10px;border-radius:6px;background:#111;color:#fff;font:600 13px system-ui;pointer-events:none;opacity:.9"
    document.documentElement.append(c, cap)
    addEventListener("mousemove", (e) => { c.style.left = e.clientX + "px"; c.style.top = e.clientY + "px"; sessionStorage.setItem("qa-pos", JSON.stringify([e.clientX, e.clientY])) }, true)
    addEventListener("mousedown", () => (c.style.transform = "scale(.55)"), true)
    addEventListener("mouseup", () => (c.style.transform = ""), true)
  }
  if (document.readyState === "loading") addEventListener("DOMContentLoaded", add); else add()
}

async function caption(page: Page, text: string) {
  await page.evaluate((t) => { sessionStorage.setItem("qa-caption", t); const el = document.getElementById("qa-caption"); if (el) el.textContent = t }, text).catch(() => {})
}
/** Amène le curseur sur l'élément (trajectoire visible), puis clique. */
async function click(page: Page, loc: Locator) {
  await loc.scrollIntoViewIfNeeded()
  const b = await loc.boundingBox()
  if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 }); await page.waitForTimeout(120) }
  await loc.click()
}
async function type(page: Page, loc: Locator, text: string) {
  await click(page, loc); await loc.fill(""); await page.keyboard.type(text, { delay: 30 })
}
const euros = (s: string | null) => Number((s ?? "").replace(/[^\d,]/g, "").replace(",", "."))

async function waitForMail(to: string, subject: RegExp): Promise<string> {
  for (let i = 0; i < 20; i++) {
    const r = await fetch(`${MAILPIT}/api/v1/search?query=${encodeURIComponent(`to:${to}`)}`).then((r) => r.json()).catch(() => ({}))
    const m = (r.messages ?? []).find((x: { Subject: string }) => subject.test(x.Subject))
    if (m) return m.Subject
    await new Promise((s) => setTimeout(s, 1000))
  }
  throw new Error(`aucun e-mail « ${subject} » reçu par ${to}`)
}
async function adminToken(): Promise<string | null> {
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) return null
  const r = await fetch(`${BACKEND}/auth/user/emailpass`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) })
  return (await r.json()).token ?? null
}
const admin = (token: string, path: string, body?: unknown) =>
  fetch(`${BACKEND}${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json())

async function newShopper(browser: Browser, opts: Parameters<Browser["newContext"]>[0], dir: string) {
  const ctx = await browser.newContext({ ...opts, baseURL: process.env.STORE_URL ?? "http://localhost:8000", recordVideo: { dir, size: { width: 1280, height: 800 } } })
  await ctx.addInitScript(OVERLAY)
  const page = await ctx.newPage()
  return { ctx, page }
}

test.describe.configure({ mode: "serial" })

let ctx: BrowserContext, page: Page
const jsErrors: string[] = []
const email = `qa.${Date.now()}@example.com`
let orderNo = ""

test.beforeAll(async ({ browser }, info) => {
  ({ ctx, page } = await newShopper(browser, { viewport: { width: 1440, height: 900 } }, info.project.outputDir + "/videos"))
  page.on("pageerror", (e) => jsErrors.push(`${page.url()} : ${e.message}`))
})
test.beforeEach(async ({}, info) => { await caption(page, info.title) })
test.afterEach(async ({}, info) => { await info.attach("écran", { body: await page.screenshot(), contentType: "image/png" }) })
test.afterAll(async () => { await ctx.close() }) // termine la vidéo

// ---------- 1. Navigation
test("NAV-02 Bandeau cookies : « Tout refuser » le ferme durablement", async () => {
  await page.goto("/")
  const refuse = page.getByRole("button", { name: "Tout refuser" })
  await click(page, refuse)
  await expect(refuse).toBeHidden()
  await page.reload()
  await expect(page.getByRole("button", { name: "Tout refuser" })).toBeHidden()
})

test("NAV-01 Accueil : promesse, prix, modèles", async () => {
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Quelques centimètres de plus")
  await expect(page.getByText(/À partir de \d+,\d{2}/)).toBeVisible()
  const cards = page.locator('section[aria-labelledby="modeles"] article')
  await expect(cards).toHaveCount(4)
  await expect(cards.locator("img")).toHaveCount(4)
  await page.mouse.wheel(0, 900); await page.waitForTimeout(600)
  await expect(page.getByRole("img", { name: /Coupe d'une basket réhaussante/ })).toBeVisible()
})

test("NAV-06 FAQ : une question se déplie", async () => {
  const q = page.getByText("Est-ce que ça se voit ?")
  await click(page, q)
  await expect(page.getByText(/la réhausse est à l'intérieur de la chaussure/)).toBeVisible()
})

test("NAV-03 Menu : chaque rubrique s'ouvre", async () => {
  const nav = page.getByRole("navigation", { name: "Principal" })
  await click(page, nav.getByRole("link", { name: "Tous les modèles" }))
  await expect(page.getByRole("heading", { level: 1, name: "Baskets réhaussantes" })).toBeVisible()
  await click(page, nav.getByRole("link", { name: "Basses" }))
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/basses/i)
  await click(page, nav.getByRole("link", { name: "Sport" }))
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/sport/i)
  await click(page, nav.getByRole("link", { name: "Guide des tailles" }))
  await expect(page).toHaveURL(/\/guide-des-tailles$/)
})

test("NAV-04 Anciennes adresses redirigées vers le rayon", async () => {
  for (const old of ["/baskets-femme", "/baskets-homme/running/x"]) {
    const r = await page.request.get(old, { maxRedirects: 0 })
    expect(r.status(), old).toBe(308)
    expect(r.headers().location, old).toMatch(/\/baskets-rehaussantes$/)
  }
  await page.goto("/baskets-femme")
  await expect(page).toHaveURL(/\/baskets-rehaussantes$/)
})

test("NAV-05 Page inexistante : 404 lisible", async () => {
  const r = await page.goto("/n-existe-pas")
  expect(r?.status()).toBe(404)
  await expect(page.locator("main")).not.toBeEmpty()
})

// ---------- 2. Catalogue
test("CAT-01 Rayon : texte, catégories, 4 modèles avec photo", async () => {
  await page.goto(GENRE)
  await expect(page.getByRole("heading", { level: 1, name: "Baskets réhaussantes" })).toBeVisible()
  await expect(page.getByText(/semelle réhaussante intégrée sous le talon/)).toBeVisible()
  await expect(page.locator("main article")).toHaveCount(4)
  await expect(page.locator("main article img")).toHaveCount(4)
})

test("CAT-02 Filtres pointure et couleur", async () => {
  const panel = page.getByRole("complementary", { name: "Filtres" })
  await click(page, panel.getByRole("button", { name: "42", exact: true }))
  await expect(page.getByRole("button", { name: "Retirer le filtre Taille 42" })).toBeVisible()
  await click(page, panel.getByRole("button", { name: /^Noir/ }))
  await expect(page.getByRole("button", { name: "Retirer le filtre Noir" })).toBeVisible()
  const withBoth = await page.locator("main article").count()
  expect(withBoth).toBeGreaterThan(0)
  await click(page, page.getByRole("button", { name: "Retirer le filtre Taille 42" }))
  await click(page, page.getByRole("button", { name: "Retirer le filtre Noir" }))
  await expect(page.locator("main article")).toHaveCount(4)
})

test("CAT-03 Tri par prix croissant", async () => {
  const sort = page.getByRole("combobox")
  await click(page, sort)
  await sort.selectOption("prix-asc")
  await page.waitForTimeout(400)
  const prices = (await page.locator("article p.whitespace-nowrap").allTextContents()).map(euros)
  expect(prices.length).toBe(4)
  expect(prices).toEqual([...prices].sort((a, b) => a - b))
})

test("CAT-04 Catégorie Sport", async () => {
  await click(page, page.locator("main").getByRole("link", { name: /^Sport/ }).first())
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Baskets réhaussantes sport/i)
  await expect(page.locator("main article")).toHaveCount(1)
})

// ---------- 3. Fiche produit
test("PDP-01 Fiche cuir : photos, prix, délai, pointures", async () => {
  await page.goto(GENRE)
  await click(page, page.locator("main article a", { hasText: "Baskets réhaussantes cuir" }))
  await expect(page).toHaveURL(new RegExp(`${CUIR}$`))
  await expect(page.getByRole("heading", { level: 1, name: "Baskets réhaussantes cuir" })).toBeVisible()
  await expect(page.locator("main p.text-2xl")).toContainText("79,00")
  await expect(page.getByText("Livraison 7-13 jours ouvrés")).toBeVisible()
  expect(await page.locator("main img").count()).toBeGreaterThanOrEqual(4)
  expect(await page.locator('button[aria-label^="Taille "]').count()).toBeGreaterThanOrEqual(5)
})

const mainSrc = () => page.locator("main img").first().getAttribute("src")

test("PDP-02 La grande photo suit la couleur", async () => {
  const before = await mainSrc()
  const other = (await page.getByRole("button", { name: "Blanc", exact: true }).getAttribute("aria-pressed")) === "true" ? "Noir" : "Blanc"
  await click(page, page.getByRole("button", { name: other, exact: true }))
  await expect.poll(mainSrc).not.toBe(before)
  const after = await mainSrc()
  await click(page, page.getByRole("button", { name: other === "Blanc" ? "Noir" : "Blanc", exact: true }))
  await expect.poll(mainSrc).not.toBe(after)
})

test("PDP-03 Choix de la réhausse +6 / +8 cm", async () => {
  for (const h of ["+6 cm", "+8 cm"]) {
    await click(page, page.getByRole("button", { name: `Réhausse ${h}` }))
    await expect(page.locator("legend", { hasText: "Réhausse" })).toContainText(h)
  }
  await expect(page.getByText("annoncée par le fabricant")).toBeVisible()
})

test("PDP-04 Version fourrée (aspect daim) et pointures épuisées", async () => {
  await page.goto(DAIM)
  await click(page, page.getByRole("button", { name: "Fourrée" }))
  await expect(page.locator("legend", { hasText: "Version" })).toContainText("Fourrée")
  const out = page.locator('button[aria-label^="Taille "][disabled]')
  if (await out.count()) await expect(out.first()).toHaveAttribute("aria-label", /épuisée/)
  await click(page, page.getByRole("button", { name: "Standard" }))
  await expect(page.locator("legend", { hasText: "Version" })).toContainText("Standard")
})

test("PDP-05 Pointure obligatoire avant l'ajout", async () => {
  await page.goto(CUIR)
  await click(page, page.getByRole("button", { name: /ajouter au panier/i }))
  await expect(page.getByRole("alert").filter({ hasText: "Choisissez une taille" })).toBeVisible()
  await expect(page).toHaveURL(new RegExp(`${CUIR}$`))
})

test("PDP-06 Ajout au panier", async () => {
  await click(page, page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first())
  await click(page, page.getByRole("button", { name: /ajouter au panier/i }))
  await expect(page).toHaveURL(/\/panier$/)
  await expect(page.locator("main")).toContainText("Baskets réhaussantes cuir")
  await expect(page.getByRole("link", { name: "Panier, 1 article" })).toBeVisible()
})

// ---------- 4. Panier
const total = () => page.getByText(/Total TTC/).locator("..").textContent()

test("CART-01 Quantité + / −", async () => {
  const before = await total()
  await click(page, page.getByRole("button", { name: "Ajouter une paire" }))
  await expect.poll(total).not.toBe(before)
  await expect(page.getByRole("link", { name: "Panier, 2 articles" })).toBeVisible() // le compteur de l'en-tête suit
  await click(page, page.getByRole("button", { name: "Retirer une paire" }))
  await expect.poll(total).toBe(before)
  await expect(page.getByRole("link", { name: "Panier, 1 article" })).toBeVisible()
})

test("CART-02 Code promo invalide refusé", async () => {
  await click(page, page.getByRole("button", { name: /Code promotionnel/ }))
  await type(page, page.getByLabel("Code promotionnel"), "FAUX123")
  await click(page, page.getByRole("button", { name: "Appliquer" }))
  await expect(page.getByText("Ce code n'est pas valide.")).toBeVisible()
})

test("CART-03 Code NOEL10 : −10 % et total cohérent", async () => {
  await type(page, page.getByLabel("Code promotionnel"), "NOEL10")
  await click(page, page.getByRole("button", { name: "Appliquer" }))
  const summary = page.getByRole("complementary", { name: "Récapitulatif" })
  await expect(summary.getByText("Réduction")).toBeVisible({ timeout: 15_000 })
  const line = async (label: string) => euros(await summary.locator("div").filter({ has: page.locator("dt", { hasText: label }) }).locator("dd").textContent())
  const sub = await line("Sous-total"), discount = await line("Réduction"), shipping = await line("Livraison")
  const grand = euros(await summary.getByText(/Total TTC/).locator("..").locator("span").last().textContent())
  expect(discount).toBeCloseTo(sub * 0.1, 2)
  expect(Math.round((sub - discount + shipping) * 100)).toBe(Math.round(grand * 100))
})

test("CART-04 Suppression : panier vide, puis nouvel article", async () => {
  await click(page, page.getByRole("button", { name: "Supprimer" }))
  await expect(page.getByText("Votre panier est vide")).toBeVisible()
  await click(page, page.getByRole("link", { name: "Voir les modèles" }))
  await click(page, page.locator("main article a", { hasText: "semelle épaisse" }))
  await expect(page).toHaveURL(new RegExp(`${EPAISSE}$`))
  await click(page, page.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first())
  await click(page, page.getByRole("button", { name: /ajouter au panier/i }))
  await expect(page).toHaveURL(/\/panier$/)
})

// ---------- 5. Commande
test("CHK-01 Formulaire vide refusé", async () => {
  await click(page, page.getByRole("link", { name: "Commander" }).or(page.getByRole("button", { name: "Commander" })).first())
  await expect(page).toHaveURL(/\/commande$/)
  await click(page, page.getByRole("button", { name: /continuer vers la livraison/i }))
  await expect(page.getByRole("alert").first()).toBeVisible()
  await expect(page.getByRole("button", { name: /continuer vers le paiement/i })).toBeHidden()
})

test("CHK-02 Téléphone invalide refusé", async () => {
  await type(page, page.getByLabel("Adresse e-mail"), email)
  await type(page, page.getByLabel("Prénom"), "Camille")
  await type(page, page.getByLabel("Nom", { exact: true }), "Recette")
  await type(page, page.getByLabel("Adresse de livraison"), "10 rue de la Paix")
  await type(page, page.getByLabel("Code postal"), "75002")
  await type(page, page.getByLabel("Ville"), "Paris")
  await type(page, page.getByLabel("Téléphone"), "abc")
  await click(page, page.getByRole("button", { name: /continuer vers la livraison/i }))
  await expect(page.getByText(/numéro de téléphone valide/)).toBeVisible()
})

test("CHK-03 Livraison et délai annoncé", async () => {
  await type(page, page.getByLabel("Téléphone"), "06 12 34 56 78")
  await click(page, page.getByRole("button", { name: /continuer vers la livraison/i }))
  await click(page, page.getByRole("button", { name: /continuer vers le paiement/i }))
  await expect(page.getByText(/7 à 13 jours ouvrés/).first()).toBeVisible()
})

test("CHK-04 CGV obligatoires", async () => {
  const fake = page.getByRole("radio", { name: /Paiement factice/ })
  await expect(fake.or(page.getByRole("note").filter({ hasText: "Mode test" }))).toBeVisible()
  if (await fake.isVisible()) await click(page, fake)
  await click(page, page.getByRole("button", { name: /commander avec obligation de paiement/i }))
  await expect(page.getByRole("alert").filter({ hasText: "conditions générales de vente" })).toBeVisible()
})

test("CHK-05 Commande confirmée, panier vidé", async () => {
  await click(page, page.getByRole("checkbox"))
  await click(page, page.getByRole("button", { name: /commander avec obligation de paiement/i }))
  await expect(page).toHaveURL(/confirmation/, { timeout: 60_000 })
  orderNo = (await page.locator("main").textContent())?.match(/n[°o]\s*(\d+)/i)?.[1] ?? ""
  expect(orderNo, "numéro de commande").not.toBe("")
  await expect(page.locator("main")).toContainText("7 à 13 jours ouvrés")
  await expect(page.getByRole("link", { name: "Panier, 0 article" })).toBeVisible()
})

test("CHK-06 E-mail de confirmation", async () => {
  expect(orderNo, "dépend de CHK-05").not.toBe("")
  expect(await waitForMail(email, /Confirmation de votre commande/)).toContain(orderNo)
})

// ---------- 6. Après-vente
test("POST-01 Rétractation en ligne + accusé", async () => {
  expect(orderNo, "dépend de CHK-05").not.toBe("")
  await click(page, page.getByRole("contentinfo").getByRole("link", { name: /rétractation/ }))
  await type(page, page.getByLabel("Numéro de commande"), orderNo)
  await type(page, page.getByLabel("E-mail utilisé pour la commande"), email)
  await click(page, page.getByRole("button", { name: "Continuer" }))
  await click(page, page.getByRole("button", { name: "Confirmer la rétractation" }))
  await expect(page.getByRole("heading", { name: "Rétractation enregistrée" })).toBeVisible()
  expect(await waitForMail(email, /rétractation/i)).toContain(orderNo)
})

test("POST-02 Calculateur de pointure", async () => {
  await click(page, page.getByRole("navigation", { name: "Principal" }).getByRole("link", { name: "Guide des tailles" }))
  await type(page, page.getByLabel("Longueur du pied (cm)"), "27,5")
  await click(page, page.getByRole("button", { name: "Calculer" }))
  await expect(page.getByText(/Pointure conseillée : \d{2}/)).toBeVisible()
})

test("LEG-01 Toutes les pages du pied de page répondent", async () => {
  const links = await page.getByRole("contentinfo").locator('a[href^="/"]').evaluateAll((as) => [...new Set(as.map((a) => a.getAttribute("href")!))])
  expect(links.length).toBeGreaterThanOrEqual(8)
  for (const href of links) {
    await click(page, page.getByRole("contentinfo").locator(`a[href="${href}"]`).first())
    await expect(page).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`))
    await expect(page.locator("main"), href).not.toBeEmpty()
  }
})

// ---------- 7. Données (admin) et robustesse
test("CART-05 Article retiré de la vente : enlevé du panier avec un message (admin)", async () => {
  const token = await adminToken()
  test.skip(!token, "ADMIN_EMAIL / ADMIN_PASSWORD non fournis")
  const { products } = await admin(token!, "/admin/products?status[]=draft&limit=1&fields=id,handle,title")
  const p = products[0]
  await admin(token!, `/admin/products/${p.id}`, { status: "published" })
  try {
    await expect.poll(async () => (await page.goto(`${GENRE}/x/${p.handle}`))?.status(), { timeout: 20_000 }).toBe(200)
    await click(page, page.locator('button[aria-label^="Taille "]:not([disabled])').first())
    await click(page, page.getByRole("button", { name: /ajouter au panier/i }))
    await expect(page).toHaveURL(/\/panier$/)
  } finally {
    await admin(token!, `/admin/products/${p.id}`, { status: "draft" })
  }
  await page.reload()
  await expect(page.getByRole("status")).toContainText("n'est plus en vente")
  await expect(page.getByText("Votre panier est vide")).toBeVisible()
})

test("ADM-01 Modification dans l'admin visible en moins de 10 s (admin)", async () => {
  const token = await adminToken()
  test.skip(!token, "ADMIN_EMAIL / ADMIN_PASSWORD non fournis")
  const { products } = await admin(token!, "/admin/products?handle=baskets-rehaussantes-semelle-epaisse-homme&fields=id,subtitle")
  const { id, subtitle } = products[0]
  await admin(token!, `/admin/products/${id}`, { subtitle: "Recette QA en cours" })
  try {
    await expect.poll(async () => { await page.goto(EPAISSE); return page.getByText("Recette QA en cours").isVisible() }, { timeout: 10_000 }).toBe(true)
  } finally {
    await admin(token!, `/admin/products/${id}`, { subtitle })
  }
})

test("MOB-01 Parcours iPhone : menu, fiche, réhausse, panier", async ({ browser }, info) => {
  const m = await newShopper(browser, { ...devices["iPhone 13"] }, info.outputDir + "/video-mobile")
  const p = m.page
  try {
    await p.goto("/")
    await caption(p, info.title)
    const refuse = p.getByRole("button", { name: "Tout refuser" })
    if (await refuse.isVisible().catch(() => false)) await click(p, refuse)
    await click(p, p.getByRole("button", { name: "Ouvrir le menu" }))
    await click(p, p.getByRole("dialog", { name: "Menu" }).getByRole("link", { name: "Réhaussantes", exact: true }))
    await expect(p.getByRole("heading", { level: 1, name: "Baskets réhaussantes" })).toBeVisible()
    await click(p, p.locator("main article a", { hasText: "sport" }).first())
    await click(p, p.getByRole("button", { name: "Réhausse +8 cm" }))
    await click(p, p.locator('button[aria-label^="Taille "]:not([disabled]):not([aria-label*="plus que"])').first())
    await click(p, p.getByRole("button", { name: /ajouter au panier/i }))
    await expect(p).toHaveURL(/\/panier$/)
    await expect(p.locator("main")).toContainText("+8 cm")
    expect(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), "aucun débordement horizontal").toBe(true)
    await info.attach("écran mobile", { body: await p.screenshot(), contentType: "image/png" })
  } finally { await m.ctx.close() }
})

test("ERR-01 Aucune erreur JavaScript pendant la recette", async () => {
  expect(jsErrors).toEqual([])
})
