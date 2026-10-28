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

## État

Squelette qui tourne en local : migrations générées (`src/modules/*/migrations`), parcours de rétractation testé de bout en bout. Pour tester sans vraie boutique : `npx medusa exec ./src/scripts/seed-test-order.ts` crée la commande n°1 (client.test@example.com). Reste : e-mail d'accusé de rétractation (obligatoire), catalogue, panier, Stripe. Détail dans `docs/ARCHITECTURE.md` §11.

Aucun secret dans git : `.env*` est ignoré, seuls les `.env.example` sont versionnés.
