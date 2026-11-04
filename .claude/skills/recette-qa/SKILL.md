---
name: recette-qa
description: Run or extend the QA test plan of baskets-shop (docs/qa/CAHIER-DE-TESTS.md + e2e/qa/cahier.spec.ts) with a visible cursor, then report results case by case. Use when the user asks to test the site, says something "doesn't work", or after any change to catalogue, cart or checkout.
---

# Recette QA de la boutique

## Avant de lancer

1. Vérifier la stack : base de données (docker compose), backend sur `localhost:9000/health`, boutique sur `localhost:8000`, Mailpit sur `localhost:8025`.
2. **Préchauffer toutes les pages** avec curl, une par une. Le serveur Next de développement compile chaque page à la première visite : jusqu'à plus d'une minute sur cette machine très chargée. Sans préchauffage, les tests échouent par délai dépassé, pas par vrai bug.
3. Ne jamais lancer deux suites Playwright en même temps : même base, même panier, même Mailpit.

## Lancer (dossier `e2e/`)

- Cahier complet, navigateur visible : `ADMIN_EMAIL=… ADMIN_PASSWORD=… npm run qa`. Les cas « admin » sont sautés sans ces variables.
- Un cas : `npm run qa -- -g "CHK-05"`.
- Rapport avec vidéo et captures : `npm run qa:report`.
- Suite historique, ordinateur et iPhone : `npx playwright test`.

## Recette à la main par Claude (serveur MCP Playwright)

`.mcp.json` déclare le serveur `playwright` : `@playwright/mcp@0.0.83` de Microsoft, version figée, dans Google Chrome visible, avec un profil vierge à chaque session (`--isolated`). C'est l'outil à utiliser pour une recette exploratoire sans script, ou pour rejouer un cas du cahier pas à pas :
- `browser_navigate`, `browser_snapshot` (lire la page : rôles et libellés), `browser_click` et `browser_type` (cibler un élément par sa référence dans le snapshot) ;
- `--caps vision` : `browser_mouse_move_xy` et `browser_mouse_click_xy` pour déplacer et cliquer au pixel près, comme un humain ;
- `--caps devtools` : console et réseau ;
- `browser_take_screenshot` : captures dans `e2e/qa-results/mcp`.

Le serveur n'est chargé qu'au démarrage d'une session, après l'approbation du fichier `.mcp.json` par l'utilisateur. Il faut toujours suivre le cahier : identifiant du cas, résultat attendu, constat.

## Ajouter un cas

1. L'écrire d'abord dans `docs/qa/CAHIER-DE-TESTS.md` : identifiant, étapes, résultat attendu, priorité.
2. Puis l'écrire dans `e2e/qa/cahier.spec.ts` avec le même identifiant en tête du titre.
3. Utiliser les helpers `click()` et `type()` pour que le curseur reste visible.
4. Ne jamais attendre un délai fixe : attendre l'état attendu de la page.

## Rendre compte

- Lister chaque cas ✓ ou ✗.
- Pour chaque ✗ : capture, cause (vrai bug ou lenteur du serveur de développement) et correction.
- Ajouter une ligne au « Journal d'exécution » du cahier.
- Un bug trouvé à la main donne un nouveau cas dans le cahier, pour qu'il ne revienne pas.
