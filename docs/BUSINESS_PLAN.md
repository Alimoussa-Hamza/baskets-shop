# Business plan – boutique de baskets (v0, paramétrable)

Document rédigé le 28/10/2026. **Tous les chiffres ci-dessous sont des hypothèses [H] ou des estimations [E]**, sauf mention [V]. Niche, budget et statut juridique ne sont pas encore définis : ce plan est un modèle à corriger, pas une prévision.

## 1. Proposition

- Baskets homme et femme, France + UE, dropshipping avec fournisseurs UE.
- Différenciation : photos 100 % uniques d'échantillons commandés, descriptions rédigées, guide des tailles par longueur de pied (réduit les retours), private label ou marques sous accord écrit. Aucune marque connue sans autorisation de revente.
- Niche (à choisir avant tout achat de stock) : candidates à étudier avec Search Console/Trends et la concurrence réelle : pieds larges, grandes pointures femme, petites pointures homme, running urbain, sneakers végétales. Aucune n'est validée.

## 2. Économie unitaire (modèle)

Hypothèses [H], à remplacer par les devis fournisseurs :

| Ligne | Valeur | Note |
|---|---|---|
| Panier moyen TTC | 85,00 € | TVA 20 % → 70,83 € HT |
| Coût produit fournisseur HT | 38,00 € | [H] |
| Livraison fournisseur → client HT | 6,00 € | [H] |
| Frais de paiement | 1,5 % + 0,25 € = 1,52 € | [H] à vérifier sur la grille tarifaire Stripe en vigueur |
| Taux de retour | 12 % | [H] ; la chaussure en ligne retourne plus que la moyenne |
| Coût d'un retour non revendable (port) | 8,00 € | [H] |

Marge de contribution avant publicité, après retours : **≈ 21,13 €/commande** (calcul : 88 % × (70,83 − 38 − 6) − 1,52 − 12 % × 8).

## 3. Publicité : le point dur

| Scénario | CPC | Conversion | CPA | Marge après pub |
|---|---|---|---|---|
| Prudent | 0,60 € | 1,0 % | 60,00 € | **−38,87 €** |
| Central | 0,45 € | 1,2 % | 37,50 € | **−16,37 €** |
| Favorable | 0,45 € | 1,5 % | 30,00 € | **−8,87 €** |

**Conclusion (sous ces hypothèses)** : la publicité payante seule ne rentabilise pas ce panier. Le modèle ne tient que si une part importante des commandes vient de canaux gratuits ou peu coûteux (SEO longue traîne, e-mail, bouche-à-oreille, avis) ou si la marge brute par paire est nettement plus haute (private label, panier plus élevé). Avec 50 % de commandes organiques et un CPA payant de 37,50 €, la marge devient ≈ +2,38 €/commande : il faut alors ≈ 67 commandes/mois pour couvrir 160 € de frais fixes, c'est-à-dire **zéro rémunération**.

Leviers, par ordre d'effet [E] : marge brute (coût produit −5 € ≈ +5 €/commande), taux de retour (guide des tailles), conversion (photos uniques, avis vérifiés), panier moyen (seuil de livraison offerte), part organique.

## 4. Coûts fixes mensuels (modèle) [H]

| Poste | €/mois |
|---|---|
| Hébergement (2 instances Medusa + Postgres + Redis) | 60 |
| Stockage / CDN (R2) | 5 |
| E-mails transactionnels | 20 |
| Domaine et outils | 15 |
| Comptable | 60 |
| **Total** | **160** |

Hors statut juridique, assurance, abonnement Matomo auto-hébergé, échantillons. Alternative la moins chère : une seule instance `shared` au démarrage, Postgres managé d'entrée de gamme.

## 5. Budget de lancement (à compléter)

- Échantillons à photographier : 10 à 20 modèles × 1 paire ≈ 500 à 1 500 € [E], dépend du prix fournisseur et du nombre de couleurs.
- Création de société et marque : **à chiffrer après choix du statut** ; dépôt de marque INPI/EUIPO après recherche d'antériorité [à vérifier : tarifs officiels en vigueur].
- Relecture juridique CGV/mentions/confidentialité par un professionnel : obligatoire avant ouverture, devis à demander.
- Publicité de test : un budget plafonné que vous fixerez ; ne pas dépasser ce que vous acceptez de perdre (cf. §3).

## 6. Feuille de route et jalons (ordre du brief)

1. Niche, statut juridique, 2 à 3 fournisseurs UE (accord écrit de revente), nom de marque vérifié INPI/EUIPO.
2. Dépôt, Medusa + Postgres + Redis en local, modèle de données (livré en squelette).
3. Storefront, panier, checkout Stripe, e-mails (dont accusé de rétractation).
4. SEO technique, pages légales, rétractation, cookies, accessibilité.
5. Commande réelle de bout en bout, monitoring, sauvegardes testées, Search Console, Merchant Center.
6. Ouverture avec 10 à 20 modèles, puis contenu, liens, publicité.

## 7. Risques

| Risque | Gravité | Parade |
|---|---|---|
| Marge insuffisante face au CPA | Élevée | Sourcer à la marge, miser sur SEO/e-mail, plafonner la pub |
| Retours élevés (taille) | Élevée | Guide des tailles en cm, avis, politique claire |
| Délais fournisseurs (dropshipping) | Moyenne | Fournisseurs UE, délais affichés, suivi |
| Non-conformité légale (rétractation, CGV, cookies) | Élevée | Relecture pro avant lancement ; fonctionnalité de rétractation + accusé e-mail |
| Marque/contrefaçon | Élevée | Private label ou accord écrit uniquement |
| SEO lent | Moyenne | Longue traîne, horizon 8 à 12 mois [E] |

## 8. Prochaine décision

Le statut juridique (micro-entreprise, EURL/SASU, SAS) conditionne TVA, guichet OSS pour les ventes UE et facturation électronique ; c'est la donnée qui débloque le plus de chiffres de ce plan.
