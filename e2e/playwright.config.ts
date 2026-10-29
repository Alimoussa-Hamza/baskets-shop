import { defineConfig, devices } from "@playwright/test"

// Parcours client de bout en bout sur la stack locale déjà lancée (docker compose + backend + storefront).
// Crée de vraies commandes dans la base locale : ne jamais pointer vers la production.
export default defineConfig({
  testDir: ".",
  timeout: 120_000,
  expect: { timeout: 10_000 },
  workers: 1, // les deux appareils partagent la même base et le même Mailpit
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: process.env.STORE_URL ?? "http://localhost:8000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "telephone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "ordinateur", use: { viewport: { width: 1440, height: 900 } } },
  ],
})
