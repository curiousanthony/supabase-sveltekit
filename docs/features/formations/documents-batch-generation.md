# Formations — Génération de documents pour tous les apprenants

> **Pour qui ?** Secrétaires, responsables pédagogiques (persona Marie)
>
> **En bref :** Sur l’onglet **Documents** d’une formation, un seul clic génère les **convocations** ou **certificats** pour **tous les apprenants** inscrits. Une boîte de dialogue affiche la progression en temps réel, ignore les documents déjà envoyés, signale précisément les apprenants à compléter et conserve une trace conforme Qualiopi.

---

## Lancer une génération en masse

Depuis l’onglet **Documents** d’une formation :

- Sur la **carte de groupe** d’un type concerné (Convocations, Certificats), un bouton apparaît selon l’état :
  - **« Générer pour tous »** quand aucun document n’existe encore
  - **« Générer pour les N restants »** quand certains apprenants ont déjà leur document
  - **« Régénérer pour tous »** quand tous les apprenants ont déjà un document
- Vous pouvez aussi passer par le menu **« Générer un document »** → **« Pour tous les apprenants (N) »** sous le type souhaité.

Une boîte de dialogue de confirmation indique le nombre d’apprenants concernés et la durée estimée. Si la formation présente un **avertissement** (information utile mais non bloquante), vous devez le **prendre en compte explicitement** avant de lancer.

---

## Voir la progression en temps réel

Pendant la génération, la fenêtre affiche :

- une **barre de progression** et un compteur **« X / N apprenants prêts »** (lisible par lecteur d’écran) ;
- la **liste des apprenants** avec leur état : *en attente*, *génération…*, *généré*, *déjà envoyée*, *à compléter*.

Vous pouvez cliquer sur **« Annuler »** à tout moment : une boîte de confirmation s’ouvre dans l’application. Les documents déjà créés sont **conservés**, seuls les apprenants restants sont interrompus.

L’animation est automatiquement désactivée si vous avez activé l’option **« Réduire les animations »** dans votre système.

---

## Gérer les apprenants en erreur

À la fin de la génération, un récapitulatif indique :

- ✓ le nombre de documents **générés**
- ⊘ le nombre de documents **ignorés** (déjà envoyés ou signés)
- ⚠ le nombre d’apprenants **à compléter**

Pour chaque apprenant en erreur, un bouton **« Compléter → »** vous emmène **directement** sur le bon champ du bon apprenant (par exemple l’e-mail manquant). Une fois la correction enregistrée, un **bandeau de reprise** vous propose de revenir à la fenêtre de génération en un clic, et la nouvelle tentative ne traite que les apprenants restants.

---

## Comportement des relances

- Les apprenants dont le document est déjà à l’état **envoyé**, **signé** ou **archivé** sont **ignorés** (jamais de doublon).
- Les apprenants dont le document est à l’état **généré** voient leur version remplacée en place par la nouvelle génération.

---

## Conformité Qualiopi (lecture rapide)

Chaque document généré dans une génération en masse fait l’objet d’une **entrée dans le journal d’audit** (`formation_audit_log`), avec un identifiant de lot commun à toute la fournée. En cas d’échec d’écriture du journal, le document est annulé et l’apprenant ressort en erreur — la traçabilité ne peut pas être contournée silencieusement.

L’ensemble est **scope-é à votre espace de travail** : un utilisateur ne peut générer que pour les formations dont son organisation est propriétaire.

---

*Pour le détail technique (concurrence, idempotence, contrats serveur), voir la décision produit `docs/decisions/2026-04-09-chunk2-document-lifecycle-ux.md` (§8) et le plan d’implémentation `docs/plans/2026-04-20-T-14-batch-generation.plan.md` liés au ticket T-14.*