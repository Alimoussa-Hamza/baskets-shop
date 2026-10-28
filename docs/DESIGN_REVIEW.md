# Revue des maquettes UX Pilot – 28/10/2026

**Périmètre relu** : les 15 pages du PDF (toutes vues en image) + les 21 fichiers HTML des deux archives (analysés automatiquement : charte, polices, classes responsives, mots-clés ; seuls `Emails` et `Retraction` lus en texte). Les 19 autres HTML n'ont pas été ouverts visuellement : le PDF et eux ne se recoupent pas entièrement.
Légende : **[V]** constaté dans les fichiers · **[E]** estimation / à faire confirmer par un professionnel.

## 1. Deux directions visuelles différentes

| Source | Charte | Écrans |
|---|---|---|
| **PDF** (export React) | Bleu d'accent, fond blanc cassé, sans-serif neutre : correspond au design system demandé dans le prompt | Accueil, catégorie, fiche produit, panier, checkout (étape 1), confirmation, recherche, guide des tailles, rétractation (étape 1), CGV, compte, 4 écrans admin |
| **HTML** (2 zip) | Beige `#F5F2ED`, accent `#B89F81`, Syne + Space Grotesk, coins 24 px, intitulé « SNEAKR CONCEPT » : **ne respecte pas** la palette demandée | Mêmes écrans + **design system** et **e-mails** (qui n'existent que dans cette version) |

→ Il faut choisir une direction. Les jetons de design (couleurs, polices) ne sont documentés que dans la version beige ; la version bleue n'a pas de planche de design system. **[V]**

## 2. À corriger avant de coder (conformité et honnêteté commerciale)

| # | Constat | Pourquoi / action |
|---|---|---|
| 1 | Données inventées présentées comme réelles : « 4,8/5 sur 2 450 avis vérifiés », avis nommés, « Tous nos avis sont vérifiés », « 1 240 pts » de fidélité, « SNEAKR SAS, capital 10 000 €, RCS Paris », « boutique française », « atelier », « Paris » **[V]** | Rien de cela n'existe (statut non choisi, dropshipping UE). De faux avis ou de fausses origines sont un risque de pratique trompeuse **[E]**. Remplacer par du vrai ou retirer ; ne jamais livrer ces textes. |
| 2 | Photos de démonstration qui ressemblent à des modèles de marques connues (semelle et bandes type running de marque, montante type Air Jordan, « N » sur une urbaine) **[V visuel, à confirmer]** | Règle du brief : photos uniques, aucune marque sans accord. À remplacer par vos photos d'échantillons avant toute mise en ligne. |
| 3 | CGV : cite « article L.121-21 » ; « descriptif établi par le fournisseur » **[V]** | La page officielle service-public (consultée le 28/10/2026) cite L221-21, D221-5, R221-3 et L221-5 ; L.121-21 semble l'ancienne numérotation **[E]**. Et la phrase contredit votre règle (descriptions rédigées par vous). Textes à faire écrire/relire par un juriste. |
| 4 | **Rétractation** : seule l'étape 1 est maquettée ; ni choix « toute la commande / certains articles », ni écran d'accusé **[V]** | Parcours à compléter (étape 2, accusé avec date et heure). |
| 5 | Admin rétractations : bouton manuel « Confirmer la réception » et état « Accusé de réception : non envoyé » **[V]** | L'accusé doit partir automatiquement sur support durable avec date et heure (page service-public). Garder seulement « Renvoyer l'accusé ». L'e-mail d'accusé est **absent** des maquettes d'e-mails (il n'y en a que 2 : confirmation et expédition). |
| 6 | Numéro de commande en format « SN-2024-XXXX » **[V]** | Le backend utilise un numéro simple (1, 2, 3…). Choisir un format d'affichage et l'implémenter des deux côtés. |
| 7 | Lien « Renoncer au contrat ici » absent ou renommé sur : checkout, guide des tailles, CGV, compte (« Droit de rétractation ») **[V]** | À mettre au même libellé, dans le pied de page de toutes les pages. |
| 8 | Aucun bandeau cookies ni panneau de préférences dans aucun fichier **[V]** | Obligatoire (« refuser » aussi simple qu'« accepter »). À maquetter. |
| 9 | Checkout : étapes 2 (livraison) et 3 (paiement) non maquettées ; pas de case CGV ; PayPal/Apple Pay/Google Pay seulement en icônes dans le panier **[V]** | Écran le plus sensible : à compléter. |
| 10 | Livraison : « offerte dans toute l'UE » (accueil) vs « dès 150 € » (catégorie, panier) vs « Offerte » sur la confirmation à 139 € **[V]** | Une seule règle. |
| 11 | Retours « gratuits » partout **[V]** | Choix qui coûte : mon business plan compte 8 € par retour non revendable ; gratuit = marge plus faible. Décision à prendre sur chiffres. |
| 12 | Aucun écran mobile **[V]** | Le PDF est 100 % desktop ; les HTML ont presque aucune classe responsive (0 à 6 par fichier). Or le trafic sera surtout mobile. |

## 3. Admin : à ne pas recoder en entier

Les maquettes montrent un back-office complet (Commandes, Produits, Clients…). Ces pages existent déjà dans l'admin Medusa : on ne les refait pas (règle du brief). On garde les maquettes comme **références** pour les pages sur mesure : Rétractations, Fournisseurs, Avis, Guides des tailles, tableau de bord (courbe encore un cadre vide « Plotly »). La navigation latérale diffère d'un écran à l'autre. Les extensions de l'admin Medusa utilisent son propre kit de composants : le rendu ne sera pas identique au pixel.

## 4. Ce qui est bien

- Fiche produit : tailles avec « Plus que 2 », lien guide des tailles, note de coupe, avis vérifiés + lien « Comment sont modérés les avis ? ».
- Panier : calcul correct (139,00 + 5,90 = 144,90 € ; TVA 24,15 € = 144,90 / 6).
- Guide des tailles en cm, fiche fournisseur avec accord de revente et pièce jointe, retours conformes dans l'idée.

## 5. Écrans manquants à regénérer

Mobile (accueil, catégorie, fiche produit, panier, checkout, rétractation) · bandeau et préférences cookies · checkout étapes 2 et 3 · rétractation étape 2 et accusé · e-mail d'accusé de rétractation, remboursement, mot de passe · connexion / inscription · détail de commande · formulaire d'avis · pages Livraison et retours, Contact, FAQ, Mentions légales, Confidentialité · 404 / 500 / paiement annulé · admin : commandes fournisseur, guides des tailles, import fournisseur, flux Google.

## 6. Ordre d'implémentation proposé

1. Fiche produit, panier, checkout (avec Stripe) : le cœur de la vente.
2. Rétractation complète + e-mail d'accusé + cookies.
3. Catégorie, recherche, guide des tailles, compte.
4. Pages légales (textes relus par un pro) et admin sur mesure.
