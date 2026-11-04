---
name: import-cj
description: Find, vet and import a CJdropshipping product into baskets-shop (men's height-increasing sneakers niche). Use when the user asks to add, replace or research products from CJ, or to check stock and pricing of CJ items.
---

# Importer un produit CJ (niche baskets réhaussantes homme)

À lire aussi : la skill `produit-unique`. Un import arrive en BROUILLON et ne se publie pas tel quel.

## Étapes

1. **Rechercher.**
   - Utiliser `GET /admin/cj/products?category=<homme|homme-casual|running|femme>&q=<mot-clé>&supplier_id=<CJ Chine>`. La recherche par mot-clé seule est trop floue : il faut la combiner à une catégorie.
   - Mots-clés : `height increasing`, `elevator`, `increase`.
   - Trier par `listed` (nombre de boutiques qui vendent déjà le modèle) : préférer un nombre bas, c'est moins de concurrence.
2. **Aperçu.**
   - `GET /admin/cj/products/:pid?supplier_id=…` renvoie le plan, le port, le délai et `already_imported`.
   - Refuser si la pointure EU est illisible, s'il manque des pointures, ou s'il y a moins de 4 photos.
3. **Photos : les vérifier toutes à l'œil.** Faire une planche contact avec Playwright (pas de Pillow sur la machine). Refuser :
   - les copies de silhouettes ou de détails de marque ;
   - les logos visibles ;
   - les coloris photographiés mais non vendus ;
   - les chaussures de ville (hors niche).
4. **Importer.**
   - `POST /admin/cj/products/:pid/import` avec `{supplier_id, category_id, gender:"male"}`.
   - Catégories de la boutique : `basses`, `sport`.
5. **Rédiger.**
   - Titre de modèle à nous, et un handle qui contient « rehaussantes ».
   - Sous-titre court.
   - Description française originale : jamais le texte du fournisseur.
   - Mentions obligatoires : « Pointures X à Y », conseil guide des tailles, « Hauteurs et matières communiquées par le fabricant ».
6. **Prix.**
   - Coût de revient = achat + port + 3 € de douane.
   - Viser un prix de vente TTC d'environ 2,2 à 2,6 × le coût de revient, arrondi en …9 €.
   - Mettre à jour via `POST /admin/products/:id/variants/batch`.
7. **Publier** seulement si le test de la skill `produit-unique` passe.

## Pièges connus

- QPS 1 chez CJ, et l'API de recherche renvoie parfois 502 : réessayer après 3 s.
- Variantes « flat » (sans réhausse) dans un modèle réhaussant : les supprimer.
- La clé CJ est dans `apps/backend/.env`. Ne jamais l'afficher ni la copier.
- Le jeton admin expire : `POST /auth/user/emailpass`, comptes locaux uniquement.
- Le cache boutique se vide seul grâce à l'abonné `product-cache` (`REVALIDATE_SECRET` présent dans les deux `.env`).
