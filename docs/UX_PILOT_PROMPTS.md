# Prompts UX Pilot – maquettes de la boutique de baskets

Mode d'emploi
1. Collez le **BLOC 0 (contexte global)** en premier, dans une conversation / un projet UX Pilot, et gardez-le comme contexte pour tous les écrans. Si l'outil n'a pas de contexte persistant, recollez-le avant chaque série d'écrans.
2. Générez ensuite **un écran (ou un parcours) par prompt**, dans l'ordre : design system → storefront → légal → admin → e-mails. Les prompts courts donnent de meilleurs résultats que des prompts géants.
3. Pour chaque écran : demandez **desktop (1440 px) et mobile (390 px)**. Le mobile compte plus que le desktop pour une boutique de baskets.
4. Remplacez `[NOM_MARQUE]` par le nom choisi quand il sera vérifié (INPI/EUIPO). D'ici là gardez le placeholder.
5. Exportez vers Figma si possible : je pourrai ensuite transformer les maquettes en composants Next.js + Tailwind.

---

## BLOC 0 – Contexte global (à coller en premier)

```
Tu es designer UI/UX senior e-commerce. Conçois les maquettes d'une boutique en ligne de baskets homme et femme, vendue en France et dans l'UE, en français. Marque provisoire : [NOM_MARQUE].

OBJECTIF : une boutique premium mais accessible, rapide, rassurante, centrée sur la photo produit et la bonne taille (le taux de retour des chaussures est le risque n°1). Public : 20-45 ans, achat majoritairement sur mobile.

DIRECTION VISUELLE : minimaliste éditoriale, beaucoup d'espace blanc, grandes photos de produits sur fond neutre, typographie nette. Pas de dégradés criards, pas de pop-ups agressifs, pas de faux compte à rebours ni fausse urgence.

DESIGN SYSTEM
- Couleurs : fond #FAFAF8, texte #111111, gris secondaire #5F5F5A (contraste AA vérifié), bordures #E4E4DE, accent principal #1F4FFF (boutons principaux, liens), accent d'alerte #B42318, succès #067647. Mode sombre non requis.
- Typographie : titres « Space Grotesk » (600), texte « Inter » (400/500). Échelle : 12 / 14 / 16 / 20 / 24 / 32 / 48. Interligne 1,5 pour le texte.
- Grille 12 colonnes desktop (conteneur 1200 px), 4 colonnes mobile, gouttière 16 px, espacement base 8 px. Rayons : 8 px (champs, boutons), 12 px (cartes).
- Boutons : principal (plein accent), secondaire (contour), tertiaire (texte). Hauteur 48 px, zone tactile ≥ 44 px. États : normal, survol, focus visible (anneau 3 px), désactivé, chargement.
- Accessibilité WCAG 2.1 AA : contraste texte ≥ 4,5:1, focus visible partout, libellés de champs toujours visibles (pas de placeholder seul), messages d'erreur textuels (pas seulement la couleur), taille de texte minimale 14 px.
- Composants à réutiliser : en-tête (logo, recherche, compte, panier avec compteur), méga-menu Femme / Homme, carte produit (photo, nom, prix TTC, pastilles couleurs, note), sélecteur de taille, badge « Avis vérifié », fil d'Ariane, pied de page, bandeau cookies, toasts, tiroir (drawer), modales.

RÈGLES MÉTIER À RESPECTER DANS TOUS LES ÉCRANS
- Tous les prix sont affichés TTC en euros (ex. « 89,00 € »).
- Le pied de page de TOUTES les pages contient un lien visible « Renoncer au contrat ici (rétractation) », en plus des liens Mentions légales, CGV, Confidentialité, Cookies, Médiateur, Livraison et retours, Contact.
- Le bandeau cookies met « Tout refuser » et « Tout accepter » au même niveau visuel (même taille, même style de bouton), plus « Personnaliser ».
- Les avis affichent s'ils sont « vérifiés » (achat confirmé) ou non, avec un lien « Comment sont modérés les avis ? ».
- Pas de photos de marques connues ni de logos réels : utiliser des zones de photo produit neutres étiquetées « Photo produit unique » avec un ratio 4:5.
- Textes réalistes en français, pas de lorem ipsum.
```

---

## BLOC 1 – Design system (1 prompt)

```
Génère la planche du design system de [NOM_MARQUE] : palette (avec valeurs et contrastes), typographie, boutons (tous états), champs de formulaire (normal, focus, erreur, succès, désactivé), cases à cocher, boutons radio, sélecteur de taille (taille disponible, indisponible barrée, sélectionnée, dernière paire), pastilles de couleur, badges (« Nouveau », « Avis vérifié », « Plus que 2 paires »), carte produit, onglets, accordéon, fil d'Ariane, toasts, tiroir latéral, modale, tableau, pagination. Desktop uniquement, une planche lisible.
```

## BLOC 2 – Storefront (un prompt par écran, desktop + mobile)

**2.1 Accueil**
```
Page d'accueil : bandeau d'annonce fin (livraison et retours), en-tête avec méga-menu Femme/Homme, hero avec grande photo et deux boutons (« Baskets femme », « Baskets homme »), bandeau de réassurance (livraison depuis l'UE, retours 14 jours, paiement sécurisé, guide des tailles en cm), sélection « Nouveautés » (carrousel de 4 cartes), blocs catégories (Running, Urbaines, Montantes, Grandes pointures), bloc « Trouvez votre taille grâce à la longueur de pied », avis clients vérifiés, newsletter (champ e-mail + case de consentement non pré-cochée), pied de page complet.
```

**2.2 Catégorie avec filtres** (ex. « Baskets femme »)
```
Page catégorie « Baskets femme » : fil d'Ariane, titre H1, courte intro, barre de tri (Pertinence, Prix croissant/décroissant, Nouveautés), filtres à gauche sur desktop (taille, couleur, marque, prix avec curseur, usage, disponibilité) et en tiroir plein écran sur mobile avec bouton « Voir 24 résultats », grille de cartes produit (3 colonnes desktop, 2 mobile), pagination, état « aucun résultat », puces des filtres actifs supprimables. Variante : page de sous-catégorie SEO « Baskets femme running » avec une intro de 100 à 200 mots avant la grille.
```

**2.3 Fiche produit** (écran le plus important)
```
Fiche produit d'une basket : fil d'Ariane, galerie (6 photos, zoom, vignettes ; carrousel avec points sur mobile), nom, marque, prix TTC, note moyenne avec nombre d'avis, sélecteur de couleur (pastilles), sélecteur de taille EU avec indication de stock par taille (« Plus que 2 paires »), lien « Guide des tailles » qui ouvre un tiroir (saisir sa longueur de pied en cm → taille EU conseillée, avec note de coupe « taille normalement »), bouton principal « Ajouter au panier » (sticky en bas sur mobile), délai de livraison estimé, retours 14 jours, accordéon (Description, Caractéristiques : matière, semelle, drop ; Livraison et retours ; Entretien), section avis (répartition par étoiles, badge « Avis vérifié » ou « Avis non vérifié », lien « Comment sont modérés les avis ? », bouton « Laisser un avis »), « Vous aimerez aussi » (4 cartes). État de la taille non sélectionnée avec message d'erreur à l'ajout, et état rupture de stock avec « Prévenez-moi du retour ».
```

**2.4 Guide des tailles (page + tiroir)**
```
Page « Guide des tailles » : explication en 3 étapes pour mesurer son pied (illustration schématique : pied sur une feuille, mesure du talon au gros orteil), calculateur (longueur en cm → pointure EU conseillée), tableau cm ↔ EU ↔ UK ↔ US pour femme et homme avec onglets, conseils de coupe par marque, FAQ taille et retours.
```

**2.5 Recherche**
```
Recherche : champ en plein écran avec suggestions en direct (produits avec miniature, catégories), recherches populaires, page de résultats avec filtres, état « aucun résultat » avec suggestions.
```

**2.6 Panier** (tiroir + page)
```
Panier : tiroir latéral après « Ajouter au panier » (miniature, nom, couleur, taille, quantité, prix TTC, supprimer, sous-total, barre de progression vers la livraison offerte, boutons « Voir le panier » et « Commander »), puis page panier complète (lignes modifiables, code promo, récapitulatif TTC avec livraison estimée, réassurance, bouton « Commander »). États : panier vide avec suggestions ; article devenu indisponible (message clair et action) ; stock insuffisant.
```

**2.7 Checkout**
```
Tunnel de commande en une page ou 3 étapes (au choix du designer, le plus simple possible), invité par défaut, sans obligation de créer un compte : 1) coordonnées et adresse de livraison (autocomplétion d'adresse, pays UE), 2) mode de livraison avec délais et prix, 3) paiement : carte bancaire (champs sécurisés), PayPal, Apple Pay, Google Pay ; récapitulatif de commande permanent (colonne droite desktop, volet repliable mobile) avec prix TTC et dont TVA ; case « J'accepte les CGV » (non pré-cochée) avec liens vers CGV, rétractation et confidentialité ; informations précontractuelles visibles (délai de livraison, droit de rétractation 14 jours) ; bouton final « Payer 129,00 € ». États : erreur de carte, paiement en cours, paiement 3D Secure en cours, article devenu indisponible pendant le paiement.
```

**2.8 Confirmation de commande**
```
Page de confirmation : message de succès, numéro de commande, récapitulatif, adresse, délai estimé, e-mail de confirmation envoyé, bouton « Suivre ma commande », rappel du droit de rétractation avec lien « Renoncer au contrat ici », proposition de créer un compte en un clic (facultatif).
```

**2.9 Compte client et suivi**
```
Espace client : connexion et inscription (e-mail + mot de passe, réinitialisation), tableau de bord, liste des commandes (statut : en préparation, expédiée, livrée), détail d'une commande (articles, suivi du colis avec frise des étapes, facture téléchargeable, bouton « Se rétracter / Retourner » avec le libellé légal), adresses, profil et préférences e-mail, suppression du compte. Plus une page « Suivre ma commande » pour les invités (n° de commande + e-mail).
```

**2.10 Rétractation (obligatoire, sans compte)**
```
Parcours « Renoncer au contrat (rétractation) », accessible sans compte, en 2 étapes, très clair et rassurant : titre, rappel « 14 jours, sans justification », étape 1/2 : numéro de commande + e-mail, choix « toute la commande » ou « certains articles » (cases) ; étape 2/2 : récapitulatif des articles concernés et bouton explicite « Confirmer la rétractation » ; écran d'accusé de réception avec date et heure, référence, mention « un e-mail de confirmation vous est envoyé », et rappel des modalités de retour du colis. États d'erreur : commande introuvable, trop de tentatives. Montre aussi le lien dans le pied de page.
```

**2.11 Pages d'aide et de marque**
```
Pages de contenu avec une mise en page éditoriale commune : Livraison et retours (zones, délais, frais, tableau), Contact (formulaire avec limitation anti-spam visible, e-mail, délai de réponse), FAQ (accordéons par thème), À propos / notre sélection (qui sommes-nous, comment nous choisissons les modèles, photos prises par nous), Médiateur de la consommation.
```

**2.12 Légal et cookies**
```
Pages légales à gabarit sobre et très lisible (sommaire ancré à gauche, texte à droite, date de mise à jour) : Mentions légales, CGV, Politique de confidentialité, Politique de cookies, Garanties légales, Accessibilité (déclaration). Plus : bandeau cookies en bas d'écran (Tout refuser / Tout accepter au même niveau, bouton Personnaliser) et panneau de préférences par catégories (nécessaires toujours actifs, mesure d'audience, publicité) avec interrupteurs désactivés par défaut et lien « Gérer mes cookies » permanent dans le pied de page.
```

**2.13 États système**
```
Pages d'erreur et d'état : 404 (avec recherche et liens utiles), 500, maintenance, page « paiement annulé », chargement (squelettes de grille produit et de fiche produit), connexion perdue.
```

## BLOC 3 – Back-office : périmètre à bien comprendre

L'admin standard (produits, commandes, clients, stocks, promotions, régions et taxes, expéditions) est **fourni par Medusa** : on ne le recode pas (règle du brief). Les maquettes admin utiles sont donc celles des **fonctions sur mesure**, qui s'insèrent dans l'interface Medusa (même langage visuel : sobre, tableaux, panneaux latéraux). Si vous voulez aussi des maquettes de l'admin standard comme référence de ce que vous utiliserez, dites-le : ce serait du design de référence, pas du développement.

**3.1 Cadre commun admin**
```
Back-office de [NOM_MARQUE] pour un seul administrateur : interface dense et sobre, menu latéral (Tableau de bord, Commandes, Rétractations, Commandes fournisseur, Produits, Stocks, Avis, Guides des tailles, Fournisseurs, Flux Google, Clients, Réglages), en-tête avec recherche globale, tableaux triables avec filtres et actions groupées, panneaux de détail latéraux, badges de statut colorés (avec texte), états vides et chargement. Même design system que le site mais plus compact (texte 14 px). Desktop uniquement, tablette en secours.
```

**3.2 Tableau de bord**
```
Tableau de bord : indicateurs du jour et du mois (chiffre d'affaires TTC, commandes, panier moyen, marge estimée, taux de retour), courbe des ventes sur 30 jours, « À traiter » (commandes à passer chez le fournisseur, rétractations à traiter, avis à modérer, ruptures de stock), meilleures ventes, taux de retour par modèle, alertes (flux Google en erreur, sauvegarde échouée).
```

**3.3 Rétractations**
```
Écran « Demandes de rétractation » : tableau (référence, n° de commande, client, date et heure de l'accusé, articles, statut : brouillon, accusée, traitée, refusée), filtres par statut et par date, délai restant avant l'échéance des 14 jours. Détail : récapitulatif de la commande, historique horodaté, e-mail d'accusé envoyé ou non (bouton « Renvoyer l'accusé »), actions « Marquer traitée » (déclenche le remboursement) et « Refuser » avec motif obligatoire, note interne, lien vers le retour fournisseur.
```

**3.4 Commandes fournisseur (dropshipping)**
```
Écran « Commandes fournisseur » : vue liste et vue colonnes (À passer, Passée, Expédiée, Livrée, Annulée) ; carte = n° de commande client, fournisseur, articles et tailles, coût fournisseur, marge, délai attendu. Détail : bouton « Marquer comme passée » avec référence fournisseur, champ numéro de suivi, copie de l'adresse de livraison en un clic, rappel du délai promis au client, alerte si le délai est dépassé, historique.
```

**3.5 Fournisseurs**
```
Écran « Fournisseurs » : tableau (nom, pays UE, délai moyen, actif) et fiche (coordonnées, n° de TVA, expédie depuis l'UE, référence de l'accord écrit de revente avec pièce jointe, marques autorisées, conditions de retour, historique des commandes, délai moyen constaté, taux d'incidents).
```

**3.6 Avis**
```
Écran « Modération des avis » : file « À modérer », filtres (en attente, approuvé, refusé), détail (note, texte, auteur, produit, badge « achat vérifié » avec la commande liée), boutons « Approuver » et « Refuser » avec motif, raccourcis clavier, réponse du magasin, rappel de la méthode de modération affichée publiquement.
```

**3.7 Guides des tailles**
```
Écran « Guides des tailles » : liste (marque, genre, nombre de lignes) et éditeur (titre, marque, genre, note de coupe, tableau éditable longueur de pied en cm ↔ pointure EU avec ajout de ligne, aperçu en direct du calculateur du site).
```

**3.8 Import fournisseur et flux Google**
```
Deux écrans : 1) « Importer un catalogue fournisseur » : dépôt de fichier CSV, mappage des colonnes vers les champs (genre, tranche d'âge, couleur, taille, marque, GTIN/MPN, longueur de pied en cm), aperçu, erreurs ligne par ligne, rappel « descriptions et photos à rédiger/prendre vous-même, ne pas reprendre celles du fournisseur » ; 2) « Flux Google Merchant Center » : état du flux, dernier envoi, produits en erreur avec la raison (GTIN manquant, genre manquant…), lien de correction direct.
```

## BLOC 4 – E-mails transactionnels (largeur 600 px)

```
Maquettes d'e-mails transactionnels sobres, lisibles en mode clair et sombre, compatibles mobile, avec le logo, le récapitulatif de commande en TTC, un bouton principal et le pied légal : 1) confirmation de commande, 2) expédition avec numéro de suivi, 3) livraison et demande d'avis, 4) accusé de réception de rétractation (date et heure, référence, articles, modalités de retour du colis), 5) remboursement effectué, 6) réinitialisation du mot de passe.
```

---

## Après la génération : ce que je ferai avec les maquettes

1. Vérifier le contraste, les états (erreur, vide, chargement) et la conformité des écrans légaux avec les règles du brief.
2. Les transformer en composants Next.js + Tailwind, un écran à la fois, en commençant par fiche produit, panier, checkout.
3. Pour l'admin, l'intégrer comme extensions de l'admin Medusa (pages et widgets sur mesure), sans le recoder.

Limite : je ne connais pas les limites de longueur ni les options d'export d'UX Pilot dans votre abonnement ; adaptez le découpage si l'outil tronque un prompt.
