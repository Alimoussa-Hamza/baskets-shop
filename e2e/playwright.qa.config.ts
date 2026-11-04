import { defineConfig } from "@playwright/test"

// Recette visuelle du cahier docs/qa/CAHIER-DE-TESTS.md : navigateur visible et ralenti, vidéo et capture par cas.
// QA_HEADLESS=1 pour l'exécuter sans fenêtre (CI), QA_SLOWMO=0 pour aller à pleine vitesse.
export default defineConfig({
  testDir: "qa",
  timeout: 180_000,
  expect: { timeout: 15_000 },
  workers: 1,
  outputDir: "qa-results",
  reporter: [["list"], ["html", { outputFolder: "qa-report", open: "never" }]],
  use: {
    baseURL: process.env.STORE_URL ?? "http://localhost:8000",
    headless: process.env.QA_HEADLESS === "1",
    launchOptions: { slowMo: Number(process.env.QA_SLOWMO ?? 150) },
    actionTimeout: 60_000,
    navigationTimeout: 120_000,
  },
})
