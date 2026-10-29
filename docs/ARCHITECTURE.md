# Architecture – boutique de baskets

Document rédigé le 28/10/2026. Légende : **[V]** fait vérifié (source citée) · **[E]** estimation · **[H]** hypothèse à valider.

> Le document de référence « Projet e-commerce baskets » (4 onglets) n'a **pas** été fourni pour cette version. Les éventuelles incohérences avec lui n'ont donc pas pu être contrôlées. À faire dès réception.

## 1. Décisions (reprises du brief, inchangées)

| Domaine | Choix |
|---|---|
| Front | Next.js App Router, TypeScript, Tailwind, ISR, Server Components par défaut |
| Back | Medusa v2, 2 instances (`server` + `worker`), PostgreSQL, Redis |
| Paiement | Stripe (Elements/Checkout), puis PayPal, Apple Pay, Google Pay |
| Médias | S3 ou R2 + `next/image` (AVIF/WebP) |
| E-mails | Resend ou Brevo |
| Mesure | Matomo (exemption CNIL) ; GA4/pixels après consentement uniquement |
| Environnements | local, staging, production ; secrets et clés Stripe test/live séparés |

## 2. Versions figées (vérifiées le 28/10/2026)

| Composant | Version | Source |
|---|---|---|
| Medusa (`@medusajs/*`) | **2.22.1** [V] | `npm view @medusajs/medusa version` le 28/10/2026. L'article de blog trouvé (v2.18, 23/07/2026) est périmé. |
| Next.js | **16.4.3** [V] | `npm view next dist-tags` : `latest = 16.4.3`. Plancher de sécurité ≥ 16.4.1 selon un blog tiers (guardlayer.io, 23/10/2026) : [E], à recouper avec les advisories officielles `vercel/next.js` avant production. |
| Node.js | **24** (`.nvmrc`, Dockerfiles) [V] | Calendrier Node.js Release WG relayé par endoflife.ai : Node 24 = maintenance depuis le 20/10/2026, fin de vie 30/04/2028 ; Node 26 devient Active LTS le 28/10/2026. Je reste sur 24 (supporté jusqu'en 2028) jusqu'à confirmation du support Node 26 par Medusa. Medusa exige `node >= 22.22.0` [V]. |
| React storefront | 19.3.1 [V] (npm) | |
| React backend | 18.3.1 [V] | Peer dependency de `@medusajs/medusa` : `react-dom ^18.3.1`. |
| TypeScript | 5.9.3 | Le tag npm `latest` est 7.0.2 : je ne l'adopte pas sans compatibilité vérifiée avec Medusa et Next [H]. |
| Tailwind | 4.3.3 [V] | npm |

## 3. Vue d'ensemble

```
Navigateur ─► Storefront Next.js (ISR, CDN) ─► Medusa `server` (API store/admin)
                                                  │        │
                                         PostgreSQL        Redis (cache, event bus, workflows, verrous)
                                                  │        │
                                         Medusa `worker` (subscribers, jobs, workflows async)
Stripe ──webhook──► Medusa `server`        R2/S3 ◄── fichiers médias
```

- `server` : HTTP, admin. `worker` : événements et tâches planifiées (`DISABLE_MEDUSA_ADMIN=true`). Redis est obligatoire dès 2 instances (config déjà en place dans `apps/backend/medusa-config.ts`).
- Migrations : étape de déploiement séparée (`npm run db:migrate`) avant de basculer le trafic, jamais au démarrage.

## 4. Structure du dépôt

```
apps/backend     Medusa : config, modules métier, routes /store/withdrawals/*, subscribers
apps/storefront  Next.js : layout, page rétractation, JSON-LD, robots, sitemap
docker-compose.yml   Postgres 17, Redis 7, Mailpit ; profil `app` = stack complète
.github/workflows    ci.yml (typecheck, tests, build, gitleaks) · deploy.yml (squelette)
```

## 5. Modèle de données

- **Produit = modèle** ; **variante = taille × couleur**. Le regroupement `item_group_id` du flux Merchant Center correspond à l'identifiant du produit Medusa (le flux est généré depuis la même source que le site).
- Champs requis par Merchant Center (chaussures) : genre, tranche d'âge, couleur, taille, marque, GTIN ou MPN. À porter par les options/métadonnées du produit et de la variante. **[À vérifier]** quels champs natifs de variante Medusa 2.22 couvrent GTIN/MPN (barcode/ean/…) avant de créer des champs custom.
- Longueur de pied (cm) : donnée de variante utilisée par le guide des tailles.
- **Modules personnalisés** (squelettes livrés, migrations à générer) :
  - `withdrawal` : demandes de rétractation (brouillon → accusé horodaté).
  - `review` : avis, statut de modération, indicateur « achat vérifié ».
  - `size-guide` : tables longueur de pied → pointure EU.
  - `supplier` + `supplier_order` : fournisseurs, accord écrit de revente, commandes fournisseur (voir §5 bis).
- Génération des migrations : `npx medusa db:generate withdrawal` (idem pour les autres), puis `npm run db:migrate`.

## 5 bis. Dropshipping : connecteur fournisseur

Décision du 29/10/2026 : CJdropshipping pour démarrer, **uniquement des modèles stockés en entrepôt UE** ; private label (Portugal) ensuite. Depuis le 01/07/2026, chaque article importé hors UE paie un droit forfaitaire de 3 € (règlement (UE) 2026/382) [V, source secondaire].

- **Lien produit → fournisseur** : métadonnées de variante `supplier_id`, `supplier_sku` (pour CJ : l'id de variante « vid »), `supplier_cost_cents` (prix d'achat HT). Un fournisseur = un entrepôt ; pour CJ, `country` = pays de l'entrepôt (`fromCountryCode`) et `logistic_name` = transporteur.
- **Flux** : `order.placed` → `src/subscribers/order-placed-supplier.ts` crée une `supplier_order` par fournisseur (idempotent) et la transmet (`src/lib/supplier-dispatch.ts`) : API CJ `createOrderV2` (`src/lib/cj.ts`) ou bon de commande par e-mail. Échec → statut « à passer » + `last_error`, relançable.
- **CJ** : commandes créées avec `payType=3` (création seule) : **aucun paiement automatique**, validation et paiement dans l'espace CJ. `CJ_SANDBOX=1` pour les essais. Limite API : 1 appel/s. Jeton : 180 jours, gardé en mémoire.
- **Admin** : page « Commandes fournisseur » (`src/admin/routes/supplier-orders`) ; saisie du suivi → e-mail « votre commande est en route » au client. Routes : `GET /admin/supplier-orders`, `POST /admin/supplier-orders/:id/ship`, `POST /admin/supplier-orders/:id/retry`.
- **Testé en local le 29/10/2026** : transmission par e-mail (Mailpit), coût d'achat, saisie du suivi + e-mail client, idempotence, erreur CJ sans clé. **Non testé** : appel réel à l'API CJ (pas de compte), webhooks CJ.
- **Reste** : import du catalogue CJ, synchro stock/prix planifiée, récupération automatique du suivi (webhook CJ), page admin de gestion des fournisseurs (aujourd'hui : script `src/scripts/seed-supplier-demo.ts` pour la démo).

## 6. Paiement et stock

- Stripe via le provider Medusa officiel, clé et secret de webhook par environnement. **Jamais de numéro de carte côté serveur.**
- **Branché et testé en local le 29/10/2026 (clés de test)** : Payment Element côté navigateur (`components/card-payment.tsx`, moyens de paiement automatiques du tableau de bord Stripe), session ouverte après le choix de la livraison (`startCardPayment`), commande créée par `/complete` **après** confirmation, retour 3D Secure par `app/commande/retour`. Tests Playwright `e2e/paiement-stripe.spec.ts` : carte acceptée, carte refusée (aucune commande), 3D Secure validé. Webhooks reçus via `stripe listen` (réponses 200).
- **Compte Stripe** : les clés de test actuelles sont celles d'un autre projet (CARSERVICE) ; ouvrir un compte dédié à la boutique avant la production. Les moyens affichés (Klarna, Bancontact, Amazon Pay…) dépendent des réglages de ce compte.
- Exigences du brief encore à **tester** :
  1. Signature du webhook vérifiée sur le corps brut ; rejeu du même `event.id` sans double effet ; réponse < 5 s.
  2. Commande créée seulement après confirmation du paiement.
  3. Stock verrouillé par taille au checkout (réservation d'inventaire par variante).
  4. **Bug connu n°1** : compléments de panier prématurés par webhook Stripe → test : paiement confirmé pendant qu'un second onglet modifie le panier.
  5. **Bug connu n°2** : cache d'inventaire périmé après activation de la gestion de stock sur une variante → test : activer `manage_inventory`, vérifier la disponibilité côté storefront avant et après invalidation du cache.
  Aucun de ces deux bugs n'a été re-vérifié dans les notes de version 2.22.1 ; je n'affirme ni qu'ils persistent ni qu'ils sont corrigés.
- E-mails transactionnels : provider SMTP maison (`apps/backend/src/modules/smtp-notification`, nodemailer 10.2.1) compatible Resend (smtp.resend.com) et Brevo (smtp-relay.brevo.com) ; modèles dans `src/lib/emails.ts`. Envoyés : confirmation de commande (`order.placed`) et accusé de rétractation (`withdrawal.acknowledged`), copie cachée à `SHOP_NOTIFY_EMAIL`. **Vérifié en local le 28/10/2026** avec un serveur SMTP de capture (contenu, destinataires, Bcc non visible). **Non vérifié** : envoi réel via Resend/Brevo, SPF/DKIM/DMARC du domaine, rejeu si le SMTP est coupé, rétractation partielle. Sans `SMTP_HOST`, aucun e-mail n'est envoyé (avertissement en log) : à interdire en production.

## 7. Rétractation en ligne

**Sources.** Page officielle [entreprendre.service-public.gouv.fr/vosdroits/F23455](https://entreprendre.service-public.gouv.fr/vosdroits/F23455), consultée le 28/10/2026 [V] : fonctionnalité gratuite, facilement accessible et visible pendant tout le délai, identification claire du contrat, libellé du type « renoncer au contrat ici », bouton de type « confirmer la rétractation », **accusé de réception sur support durable mentionnant la date et l'heure**, formulaire type à proposer aussi. Articles cités : L221-21, D221-5, R221-3, L221-5.

**Points de vigilance.**
- La date du 19/06/2026 provient de sources secondaires (cabinets, presse e-commerce) ; la page service-public consultée ne la mentionne pas. [V] via sources secondaires uniquement.
- Les sources secondaires citent le « décret n° 2026-3 » pour l'e-commerce ; or son intitulé officiel sur Légifrance concerne la **commercialisation à distance de services financiers**. La base à citer pour des baskets : ordonnance n° 2026-2 du 05/01/2026 + articles L221-21 / D221-5 / R221-3. À faire confirmer par un juriste.
- Sanction : la page mentionne 15 000 € (personne physique) / 75 000 € (société) pour défaut d'information sur le droit de rétractation ; rien de spécifique sur l'absence de la fonctionnalité. Autre risque cité par la presse : prolongation du délai de rétractation en cas de non-conformité [E].

**Implémentation livrée.**
- `POST /store/withdrawals/start` (n° de commande + e-mail, sans compte) → brouillon ; `POST /store/withdrawals/confirm` → `acknowledged_at` horodaté, idempotent, événement `withdrawal.acknowledged`.
- Limitation de débit 10 requêtes/min/IP ; réponse 404 identique si commande absente ou e-mail différent.
- Page `/retractation`, lien en pied de page sur tout le site.
- E-mail d'accusé : implémenté (voir §6), testé en local seulement.
- **Reste à faire** : formulaire type téléchargeable, mention dans les CGV et sur la page produit/confirmation de commande, gestion de la rétractation partielle côté UI, calcul du délai (point de départ = réception) côté admin.

## 8. SEO

- URLs `/baskets-femme/running/nom-modele` ; titre, méta et H1 uniques ; canonicals ; sitemap dynamique (squelette) ; JSON-LD Product/Offer/AggregateRating/BreadcrumbList (`apps/storefront/src/lib/jsonld.ts`). AggregateRating uniquement avec de vrais avis approuvés.
- Filtres : canonical vers la catégorie, `robots.txt` bloque `sort=`/`filter=` ; n'indexer que les combinaisons à demande réelle, avec intro de 100 à 200 mots.
- Objectifs : LCP < 2,5 s, INP < 200 ms (mesure RUM Matomo + PageSpeed avant mise en ligne).
- Calendrier réaliste : 8 à 12 mois sur domaine neuf [E]. Aucune promesse de première place.

## 9. Sécurité

| Exigence | État |
|---|---|
| Aucun secret dans git | `.gitignore` + `.env.example` ; job gitleaks en CI |
| CORS restreint | origines exactes via variables d'env, pas de joker |
| Base avec SSL | `NODE_ENV=production` active SSL ; **`rejectUnauthorized: false` est un compromis** : fournir le CA de l'hébergeur et passer à `true` |
| Node LTS, versions figées | Node 24, versions exactes dans les `package.json` |
| Limitation de débit | en mémoire, valable pour 1 instance `server` ; **passer à Redis** avec ≥ 2 instances |
| Sauvegardes chiffrées + restauration testée | **non implémenté** : à faire à l'étape 5 (pg_dump chiffré vers R2, test de restauration trimestriel) |
| CSP | en `Report-Only`, à durcir à l'étape 4 |

## 10. Cookies, accessibilité, facturation

À traiter à l'étape 4 : bandeau « refuser = accepter », Matomo sans consentement uniquement s'il remplit les conditions d'exemption CNIL (**à vérifier sur cnil.fr avant configuration**), WCAG 2.1 AA (focus visible et lien d'évitement déjà posés), facturation électronique selon le calendrier 2026-2027 (**à vérifier sur impots.gouv.fr**, dépend du statut juridique).

## 11. Écarts et risques

1. Document de référence non fourni → pas de contrôle de cohérence.
2. Statut juridique : **micro-entreprise en France** retenue le 28/10/2026, révisable (SASU/EURL possibles plus tard). Société marocaine écartée : Stripe n'est pas disponible au Maroc (stripe.com/global, 28/10/2026) et un représentant fiscal TVA serait exigé (impots.gouv.fr, page de 2017, à confirmer). Seuils 2026 [sources secondaires, à confirmer sur service-public/impots.gouv] : plafond CA vente 203 100 € (CCI Paris IDF, 09/03/2026) ; franchise TVA 85 000 € / 93 500 € ; abattement BIC vente 71 % (Hayot Expertise, 08/06/2026) ; e-invoicing : réception dès le 01/09/2026, e-reporting des ventes aux particuliers dès le 01/09/2027 si assujetti à la TVA (MoneyVox, 23/03/2026). **Décision ouverte** : franchise de TVA ou TVA collectée. Le seed actuel suppose 20 % de TVA ; en franchise, mention « TVA non applicable, art. 293 B du CGI » à ajouter et tax region à adapter. Ventes UE hors France : seuil de 10 000 €/an [H, à vérifier], région limitée à la France pour l'instant.
3. Vérifié en local le 28/10/2026 (Postgres 16, Redis, Medusa 2.22.1, Next.js 16.4.3) : migrations des 4 modules générées et appliquées, parcours de rétractation testé de bout en bout dans un navigateur (étape 1, étape 2, rejeu idempotent, mauvais e-mail → 404, limitation de débit → 429). Parcours d'achat complet (panier, 3 étapes de checkout, commande avec paiement factice, confirmation, rétractation, refus de stock insuffisant, mobile 390 px) testé dans un navigateur le 28/10/2026 sur données de démo. Reste non testé : paiement Stripe, e-mails, les deux bugs Medusa connus.
4. Le message « un e-mail de confirmation vous est envoyé » a été retiré de la page d'accusé tant que l'e-mail n'existe pas (ne pas promettre ce qui n'est pas envoyé).
5. Coût d'hébergement : 2 instances Medusa + Postgres + Redis ≈ 60 €/mois [H]. Alternative la moins chère : démarrer en `shared` (1 instance) en staging, garder 2 instances en production.
