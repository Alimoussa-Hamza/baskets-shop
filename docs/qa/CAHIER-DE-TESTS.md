# Cahier de tests – boutique « baskets réhaussantes »

Version 1.0 – 04/11/2026. Périmètre : boutique `http://localhost:8000` (Next.js) et backend Medusa `http://localhost:9000`.

Chaque cas porte un identifiant. Le même identifiant est le nom du test automatisé dans `e2e/qa/cahier.spec.ts`. Les tests s'exécutent dans un navigateur visible : le curseur se déplace, clique et tape comme un client.

## Comment lancer

| Commande (dossier `e2e/`) | Effet |
|---|---|
| `npm run qa` | Tout le cahier, navigateur visible, curseur ralenti, vidéo de chaque test |
| `npm run qa -- -g "PDP-02"` | Un seul cas |
| `npm run qa:report` | Rapport HTML : statut, captures et vidéo par cas |
| Extension VS Code « Playwright Test » | Bouton ▶ à côté de chaque cas, case « Show browser » |

Prérequis :
- **Stack lancée** : base de données (docker compose), backend et boutique.
- **Paiement de test** : `NEXT_PUBLIC_TEST_PAYMENT=1` côté boutique.
- **E-mails** : Mailpit (`http://localhost:8025`).
- **Cas marqués « admin »** : variables `ADMIN_EMAIL` et `ADMIN_PASSWORD` (comptes locaux uniquement).

Les tests créent de vraies commandes dans la base **locale**. Ne jamais les pointer vers la production.

## Priorités

- **P1** : bloquant pour la vente (catalogue, panier, commande, obligations légales).
- **P2** : dégrade l'expérience.
- **P3** : confort.

## 1. Navigation

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| NAV-01 | Accueil | Ouvrir `/` | Titre « Quelques centimètres de plus », bouton « Voir les modèles », prix « À partir de », 4 modèles, schéma, FAQ | P1 |
| NAV-02 | Bandeau cookies | Accueil neuf, cliquer « Tout refuser », recharger | Le bandeau disparaît et ne revient pas après rechargement | P1 (CNIL) |
| NAV-03 | Menu ordinateur | Cliquer successivement Tous les modèles, Basses, Sport, Guide des tailles | Chaque page s'ouvre avec le bon titre | P1 |
| NAV-04 | Anciennes adresses | Ouvrir `/baskets-femme` puis `/baskets-homme/running/x` | Redirection permanente vers `/baskets-rehaussantes` | P2 (SEO) |
| NAV-05 | Page inexistante | Ouvrir `/n-existe-pas` | Code 404 et page d'erreur lisible | P2 |
| NAV-06 | FAQ | Cliquer « Est-ce que ça se voit ? » | La réponse se déplie | P3 |

## 2. Catalogue

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| CAT-01 | Rayon | Ouvrir `/baskets-rehaussantes` | Titre, texte d'introduction, puces Basses / Sport, 4 cartes avec photo et prix | P1 |
| CAT-02 | Filtres | Cliquer pointure 42, puis couleur Noir, puis retirer le filtre taille | Le nombre de résultats change, les étiquettes de filtre apparaissent et se retirent | P2 |
| CAT-03 | Tri | Choisir « Prix croissant » | Prix affichés dans l'ordre croissant | P2 |
| CAT-04 | Catégorie | Cliquer la puce « Sport » | 1 modèle, titre « Baskets réhaussantes sport » | P2 |

## 3. Fiche produit

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| PDP-01 | Contenu | Ouvrir « Baskets réhaussantes cuir » | Photos, prix 79 €, « Livraison 7-13 jours ouvrés », description, pointures | P1 |
| PDP-02 | Photo par couleur | Cliquer la pastille Blanc puis Noir | La grande photo change à chaque couleur | P2 |
| PDP-03 | Réhausse | Cliquer « +6 cm » puis « +8 cm » | La légende « Réhausse : +X cm » suit le choix, avec la mention « annoncée par le fabricant » | P1 |
| PDP-04 | Version | Sur « aspect daim », cliquer « Fourrée » | Légende « Version : Fourrée », pointures épuisées barrées et non cliquables | P2 |
| PDP-05 | Taille obligatoire | Cliquer « Ajouter au panier » sans pointure | Message « Choisissez une taille… », pas d'ajout | P1 |
| PDP-06 | Ajout au panier | Choisir une pointure, cliquer « Ajouter au panier » | Arrivée sur `/panier`, l'article est présent, le compteur de l'en-tête vaut 1 | P1 |

## 4. Panier

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| CART-01 | Quantité | Cliquer +, puis − | Le total passe au double puis revient ; le compteur de l'en-tête suit (2, puis 1) | P1 |
| CART-02 | Code invalide | Saisir « FAUX123 », Appliquer | « Ce code n'est pas valide. » | P2 |
| CART-03 | Code valide | Saisir « NOEL10 », Appliquer | Ligne « Réduction » = 10 % du sous-total, total cohérent | P2 |
| CART-04 | Suppression | Cliquer « Supprimer » | « Votre panier est vide » et liens vers les modèles | P1 |
| CART-05 | Article retiré de la vente (admin) | Panier contenant un modèle ensuite dépublié, ouvrir `/panier` | Article retiré automatiquement, message « n'est plus en vente » | P1 |

## 5. Commande

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| CHK-01 | Formulaire vide | Cliquer « Continuer vers la livraison » sans rien saisir | Message d'erreur, on reste à l'étape 1 | P1 |
| CHK-02 | Téléphone invalide | Remplir tout, téléphone « abc » | « Renseignez un numéro de téléphone valide » | P1 |
| CHK-03 | Livraison | Coordonnées valides, continuer | Mode de livraison affiché, délai « 7 à 13 jours ouvrés » | P1 (L221-5) |
| CHK-04 | CGV obligatoires | Cliquer « Commander avec obligation de paiement » sans cocher | Message sur les conditions générales de vente | P1 |
| CHK-05 | Commande | Cocher les CGV, payer (paiement de test) | Page de confirmation avec n° de commande et délai, panier vidé | P1 |
| CHK-06 | E-mail de confirmation | Ouvrir Mailpit | E-mail « Confirmation de votre commande » avec le bon n° | P1 |

## 6. Après-vente et pages légales

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| POST-01 | Rétractation | Formulaire `/retractation` : n° et e-mail, Continuer, Confirmer | « Rétractation enregistrée », accusé par e-mail | P1 (L221-21) |
| POST-02 | Calculateur de pointure | Guide des tailles : 27,5, Calculer | « Pointure conseillée : XX » | P2 |
| LEG-01 | Pied de page | Ouvrir chaque lien du pied de page | Toutes les pages répondent sans erreur | P1 |

## 7. Mobile, données, robustesse

| ID | Cas | Étapes | Résultat attendu | Prio |
|---|---|---|---|---|
| MOB-01 | Parcours iPhone | iPhone 13 : menu ☰, rayon, fiche, réhausse, ajout au panier | Tout est cliquable, rien ne déborde horizontalement | P1 |
| ADM-01 | Modification dans l'admin (admin) | Changer le sous-titre d'un modèle dans l'admin | Visible sur la fiche en moins de 10 s, puis remis à l'identique | P2 |
| ERR-01 | Erreurs JavaScript | Pendant tous les cas | Aucune erreur JavaScript dans la page | P1 |

## Hors périmètre automatisé (à faire à la main)

- Paiement réel par carte Stripe (mode test) : couvert par `e2e/paiement-stripe.spec.ts`.
- Rendu Safari et Firefox réels.
- Lecteur d'écran (VoiceOver).
- Vérification physique des échantillons : hauteur de réhausse mesurée, pointures.
- Relecture juridique des pages légales (brouillons).

## Journal d'exécution

| Date | Version | Résultat | Remarques |
|---|---|---|---|
| 04/11/2026 | 1.0 | **33/33 réussis** (2 min 36) | Chrome visible ; 4 anomalies trouvées et corrigées pendant la recette : ancien panier avec article retiré de la vente, photo qui ne suivait pas la couleur, compteur du panier non mis à jour, cache catalogue de 5 min après une modification admin |
