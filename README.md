# Boutique de baskets

Monorepo : `apps/backend` (Medusa 2.22.1), `apps/storefront` (Next.js 16.4.3), infra locale Docker.
Documents : [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/BUSINESS_PLAN.md`](docs/BUSINESS_PLAN.md).

## Démarrage local

```bash
nvm use                                   # Node 24 (.nvmrc)
cp .env.example .env                      # mot de passe Postgres local
docker compose up -d                      # Postgres, Redis, Mailpit (http://localhost:8025)

cd apps/backend
cp .env.example .env                      # générer JWT_SECRET et COOKIE_SECRET : openssl rand -hex 32
npm ci
npm run db:migrate                       # applique aussi les migrations des modules (déjà versionnées)
npx medusa user -e admin@example.com -p "<mot-de-passe>"      # compte admin local
npm run dev                               # API + admin : http://localhost:9000/app
# Paiement Stripe (clés de TEST dans .env) : relais des webhooks en local, à garder ouvert
# stripe listen --api-key "$STRIPE_API_KEY" --print-secret   → valeur de STRIPE_WEBHOOK_SECRET
# stripe listen --api-key "$STRIPE_API_KEY" --forward-to localhost:9000/hooks/payment/stripe_stripe
# Région France : ajouter le fournisseur « pp_stripe_stripe » (Admin > Settings > Regions) si la région existait avant les clés

cd ../storefront
cp .env.example .env                      # clé publiable : Admin > Settings > Publishable API Keys
npm ci
npm run dev                               # http://localhost:8000
```

## Tests

```bash
cd apps/backend && npm run typecheck && npm test
cd apps/storefront && npm run typecheck
```

Parcours client de bout en bout (Playwright, téléphone + ordinateur), sur la stack locale lancée avec `NEXT_PUBLIC_TEST_PAYMENT=1` et le SMTP backend vers Mailpit (`SMTP_HOST=localhost`, `SMTP_PORT=1025`) :

```bash
cd e2e
npm ci && npm run install-browser        # une seule fois
npm run e2e                               # crée de vraies commandes dans la base LOCALE
ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run e2e   # + vérifie la transmission au fournisseur
npm run e2e:report                        # rapport HTML (captures et traces en cas d'échec)
```

## État

Tourne en local de bout en bout (29/10/2026) : catalogue, panier, checkout avec paiement de test, e-mails (confirmation, accusé de rétractation, expédition), rétractation, connecteur fournisseur dropshipping (e-mail testé, API CJ codée mais pas encore appelée). Données de démo : `npx medusa exec ./src/scripts/seed-demo.ts` puis `./src/scripts/seed-supplier-demo.ts`. Reste notamment : Stripe réel, import du catalogue CJ, pages légales relues, déploiement. Détail dans `docs/ARCHITECTURE.md` §5 bis et §11.

Aucun secret dans git : `.env*` est ignoré, seuls les `.env.example` sont versionnés.
