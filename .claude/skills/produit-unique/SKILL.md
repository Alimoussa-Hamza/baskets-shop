---
name: produit-unique
description: Make baskets-shop sell "a product nobody else sells" instead of a generic CJdropshipping listing. Use when choosing, importing, branding, photographing, bundling or pricing a product, or before publishing any product page.
---

# Produit unique (règle de la boutique)

Règle : **la boutique vend un produit que personne d'autre ne vend.** Un modèle du catalogue CJ, publié avec les photos du fournisseur, ne respecte PAS la règle. D'autres boutiques CJ l'ont déjà importé : le champ `listedNum` en donne le nombre. Le même modèle est aussi sur AliExpress et Temu, et une recherche par image le retrouve.

## Test avant toute publication

Un produit est publiable seulement si les 3 réponses sont « oui » :
1. Un client qui fait une recherche Google Images avec notre photo principale tombe-t-il sur NOTRE page, et pas sur le fournisseur ?
2. L'offre (produit + contenu du colis + promesse) est-elle introuvable ailleurs telle quelle ?
3. Le nom du produit est-il le nôtre (nom de modèle de la marque), et pas une description générique ?

Sinon, garder le produit en **brouillon** et appliquer les leviers ci-dessous.

## Leviers, du moins cher au plus solide

1. **Kit exclusif** : basket + semelles réhaussantes bonus (hauteur modulable) + guide d'adaptation. Le client compare un kit, pas une chaussure. Semelles CJ ≈ 1 € pièce ; elles n'ont pas de pointure EU, donc il faut une fiche « accessoire » à part ou une ligne de kit.
2. **Photos et vidéos propres**, faites sur échantillon, avec la hauteur MESURÉE (« +6,2 cm mesurés »). Ne jamais publier les visuels CJ portant des textes (« 6CM », « Increase », flèches) : ils identifient le fournisseur et répètent une hauteur non vérifiée.
3. **Marque sur le produit** : logo sur la semelle intérieure ou la languette, boîte et carte à notre nom (CJ « Custom Packaging », possible dès 1 pièce selon CJ). Logo sur la chaussure : quantité minimale à confirmer avec un agent CJ (50 à 200 paires annoncées par des tiers). Prérequis : un nom de marque vérifié à l'INPI et à l'EUIPO (« SNEAKR » n'est qu'un nom provisoire).
4. **Modèle exclusif** : demande de sourcing CJ pour un modèle hors catalogue public, ou personnalisé (coloris, matière). Seulement après de premières ventes.

## Interdits (contrefaçon et pratiques trompeuses)

- Silhouettes ou détails de marques : Air Force 1, Dunk, Jordan, Samba, bande Gucci, clous Valentino, étoile Bape, logos visibles sur les photos. La fonction `blockedBrand` ne voit que le nom ; il faut aussi regarder les photos.
- « Cuir » quand le fabricant dit « leather » sans preuve : écrire « aspect cuir ».
- Hauteur de réhausse : « annoncée par le fabricant » tant qu'elle n'est pas mesurée.
- « Exclusif » ou « introuvable ailleurs » tant que les leviers 1 à 3 ne sont pas en place.

## Outils photo installés (04/11/2026, hors Homebrew)

Ils sont dans `~/.local/bin`, qui n'est pas dans le PATH par défaut : utiliser le chemin complet.

- `~/.local/bin/rembg i entree.jpg sortie.png` : détourage (fond transparent) des photos d'échantillons. Le modèle se télécharge au premier usage.
- `~/.claude/tools/photo/bin/python` : Python 3.12 avec Pillow et numpy. Sert au recadrage, au masquage des textes fournisseur et aux planches contact. Pour effacer les métadonnées, réenregistrer l'image sans `exif=`.
- `~/.local/bin/gh` : GitHub CLI (PR, issues). Faire `gh auth login` avant le premier usage.
- `~/.local/bin/uv` : environnements Python isolés.
- ImageMagick et ExifTool ne sont PAS installés : Homebrew exige d'abord `brew trust` sur des dépôts tiers. C'est la décision de l'utilisateur.

## Où c'est dans le code

- Import CJ : `apps/backend/src/lib/cj-import.ts` et `cj-catalog.ts`. La réhausse et la version font partie du coloris (« Marron fourrée +8 cm »), avec une photo par coloris dans `variant.metadata.image`.
- Fiche produit : `apps/storefront/src/components/product-form.tsx` (sélecteurs couleur, version, réhausse) et `product-color.tsx` (photo suivant le coloris).
- Niche et décisions : section « 5 ter » de `docs/ARCHITECTURE.md`.
