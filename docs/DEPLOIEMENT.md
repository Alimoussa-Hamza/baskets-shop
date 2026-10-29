# Déploiement – environnement de test en ligne (staging) sur Railway

Document rédigé le 29/10/2026. Hébergeur retenu : **Railway** (plan Pro, 20 $/mois incluant 20 $ d'usage ; estimation 35 à 50 $/mois pour la boutique, [tarifs](https://railway.com/pricing)). Région UE : **à confirmer** à la création du projet.

**But** : une copie privée de la boutique en ligne, en **clés Stripe de test**, protégée par mot de passe et invisible pour les moteurs de recherche. Pas de vrai client tant que les pages légales ne sont pas relues et que la société n'est pas immatriculée.

## Vérifié en local le 29/10/2026

- Image backend (`apps/backend/Dockerfile`) : build OK, démarrage en `NODE_ENV=production` OK (health, admin, catalogue servi).
- Image boutique (`apps/storefront/Dockerfile`) : build OK, pages clés en 200, accès refusé sans mot de passe (401), `robots.txt` = `Disallow: /`, en-tête `X-Robots-Tag: noindex`.
- **Non vérifié** : le déploiement sur Railway lui-même (pas de compte), la région UE, les connexions internes Railway.

## Services à créer (un projet Railway)

| Service | Source | Rôle |
|---|---|---|
| `postgres` | Base PostgreSQL Railway | Données |
| `redis` | Redis Railway | Cache, événements, tâches |
| `backend` | GitHub, dossier racine `apps/backend` (Dockerfile) | API + admin (`MEDUSA_WORKER_MODE=server`) |
| `worker` | Même dépôt et dossier que `backend` | Abonnés et tâches (`MEDUSA_WORKER_MODE=worker`, admin désactivé) |
| `storefront` | GitHub, dossier racine `apps/storefront` (Dockerfile) | Boutique Next.js |

## Ordre de mise en place

1. Créer `postgres` et `redis`.
2. Créer `backend` avec ses variables (ci-dessous). Commande de **pré-déploiement** : `npx medusa db:migrate` (les migrations ne tournent jamais au démarrage).
3. Une fois `backend` en ligne : créer l'admin (`npx medusa user -e … -p …` dans la console du service), puis dans l'admin : clé publiable (Settings > Publishable API Keys), région France avec les fournisseurs de paiement `pp_system_default` et `pp_stripe_stripe`. Pour une copie de démo : `npx medusa exec ./src/scripts/seed-demo.ts` puis `seed-supplier-demo.ts`.
4. Créer `worker` (mêmes variables que `backend`, voir différences).
5. Créer `storefront` **après** le backend : son build lit le catalogue.
6. Stripe (mode test) : Développeurs > Webhooks > ajouter l'URL `https://<domaine-backend>/hooks/payment/stripe_stripe`, événements `payment_intent.*` ; copier le secret de signature dans `STRIPE_WEBHOOK_SECRET` du backend et du worker.
7. Vérifier : se connecter à la boutique (mot de passe), passer une commande avec la carte `4242 4242 4242 4242`, voir la commande et la commande fournisseur dans l'admin.

## Variables

Références Railway : `${{postgres.DATABASE_URL}}` et `${{redis.REDIS_URL}}` (adresses internes). Générer les secrets avec `openssl rand -hex 32`.

### backend

| Variable | Valeur staging |
|---|---|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | `${{postgres.DATABASE_URL}}` |
| `DATABASE_SSL` | `false` si l'adresse interne refuse le SSL (à tester), sinon vide |
| `REDIS_URL` | `${{redis.REDIS_URL}}` |
| `MEDUSA_WORKER_MODE` | `server` |
| `DISABLE_MEDUSA_ADMIN` | `false` |
| `MEDUSA_BACKEND_URL` | `https://<domaine-backend>` |
| `STORE_CORS` | `https://<domaine-storefront>` |
| `ADMIN_CORS` / `AUTH_CORS` | `https://<domaine-backend>` (AUTH : ajouter aussi le domaine storefront, séparés par une virgule) |
| `JWT_SECRET` / `COOKIE_SECRET` | 2 secrets distincts, **différents du local** |
| `STRIPE_API_KEY` / `STRIPE_WEBHOOK_SECRET` | Clés de **test** du compte Stripe de la boutique |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` | Compte Resend ou Brevo (sinon aucun e-mail ne part) |
| `SHOP_NOTIFY_EMAIL`, `SHOP_NAME`, `SHOP_LEGAL_LINE` | Adresse de copie, nom, ligne légale |
| `CJ_API_KEY` / `CJ_SANDBOX` | Vide tant que pas de compte CJ / `1` |
| `MEDUSA_DISABLE_TELEMETRY` | `1` |

### worker

Mêmes variables que `backend`, sauf `MEDUSA_WORKER_MODE=worker` et `DISABLE_MEDUSA_ADMIN=true`. Pas de domaine public.

**Attention (constaté en local le 29/10/2026)** : au démarrage, Medusa désactive **en base** les fournisseurs (e-mail, paiement) absents de sa configuration. Un worker démarré sans `SMTP_*` ou sans `STRIPE_*` coupe donc les e-mails ou le paiement du backend qui partage la même base. Backend et worker doivent avoir **les mêmes** variables de fournisseurs, et deux environnements (local, staging, production) ne doivent **jamais** partager une base. En cas d'erreur « Could not find a notification provider », redémarrer le backend après avoir corrigé la configuration.

### storefront

Les `NEXT_PUBLIC_*` sont figées **au build** : les déclarer dans les variables du service (Railway les passe en arguments de build au Dockerfile). Toute modification impose un redéploiement.

| Variable | Valeur staging |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | `https://<domaine-storefront>` |
| `NEXT_PUBLIC_MEDUSA_BACKEND_URL` | `https://<domaine-backend>` |
| `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY` | Clé publiable créée à l'étape 3 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` |
| `STAGING_PASSWORD` / `STAGING_USER` | Mot de passe d'accès / `equipe` (lus au démarrage, pas au build) |
| `NEXT_PUBLIC_TEST_PAYMENT` | Ne pas définir : ignoré en production |

## Avant la vraie production (plus tard)

Compte Stripe **dédié** et clés **live**, domaine définitif, `STAGING_PASSWORD` vide, sauvegardes Postgres **testées** (restauration), surveillance, SPF/DKIM/DMARC du domaine d'envoi, pages légales relues. Voir le document de suivi.
