# Workflow Administratif Complet d'une Formation — Conformité Qualiopi

> Référence pour le design du système de "quêtes" (quest tracker) du SaaS Mentore Manager.
> Basé sur le Référentiel National Qualité (RNQ) v9 — Guide de lecture du 8 janvier 2024.

---

## Table des matières

1. [Qualiopi — Indicateurs applicables au niveau formation](#1-qualiopi--indicateurs-applicables-au-niveau-formation)
2. [Vue d'ensemble du cycle de vie](#2-vue-densemble-du-cycle-de-vie)
3. [Phase 1 — Conception (avant la formation)](#3-phase-1--conception-avant-la-formation)
4. [Phase 2 — Déploiement (pendant la formation)](#4-phase-2--déploiement-pendant-la-formation)
5. [Phase 3 — Évaluation (après la formation)](#5-phase-3--évaluation-après-la-formation)
6. [Spécificités par type de financement](#6-spécificités-par-type-de-financement)
7. [Spécificités par type de formation](#7-spécificités-par-type-de-formation)
8. [Récapitulatif des documents](#8-récapitulatif-des-documents)
9. [Matrice des dépendances](#9-matrice-des-dépendances)
10. [Liste complète des quêtes](#10-liste-complète-des-quêtes)

---

## 1. Qualiopi — Indicateurs applicables au niveau formation

### Les 7 critères

| # | Critère | Nb indicateurs |
|---|---------|---------------|
| 1 | **Information du public** — conditions d'information sur les prestations, délais d'accès, résultats obtenus | 3 (ind. 1-3) |
| 2 | **Objectifs et adaptation** — identification des objectifs et adaptation aux publics lors de la conception | 5 (ind. 4-8) |
| 3 | **Accueil, accompagnement, suivi** — modalités d'accueil, accompagnement, suivi et évaluation | 8 (ind. 9-16) |
| 4 | **Moyens pédagogiques et techniques** — adéquation des ressources pédagogiques, techniques et d'encadrement | 4 (ind. 17-20) |
| 5 | **Qualification des personnels** — qualification et développement des compétences des intervenants | 2 (ind. 21-22) |
| 6 | **Environnement professionnel** — inscription dans l'environnement socio-économique, veille, sous-traitance | 7 (ind. 23-29) |
| 7 | **Appréciations et réclamations** — recueil et prise en compte des retours des parties prenantes | 3 (ind. 30-32) |

### Socle commun (22 indicateurs, obligatoires pour tous les OF)

1, 2, 4, 5, 6, 9, 10, 11, 12, 17, 18, 19, 21, 22, 23, 24, 25, 26, 27, 30, 31, 32

### Indicateurs spécifiques (selon catégorie d'action)

- **Ind. 3** : formations certifiantes (RNCP/RS) — informations sur les certifications visées
- **Ind. 7** : formations certifiantes — adéquation avec le référentiel de certification
- **Ind. 8** : alternance / AFEST — positionnement à l'entrée (note : souvent appliqué volontairement par les OF classiques)
- **Ind. 13** : alternance / AFEST — coordination entreprise-centre
- **Ind. 14** : CFA uniquement — exercice de la citoyenneté
- **Ind. 15** : CFA uniquement — droits et devoirs de l'apprenti
- **Ind. 16** : formations certifiantes / CFA — présentation aux épreuves
- **Ind. 20** : alternance / CFA — personnel dédié (référent handicap, mobilité)
- **Ind. 28** : alternance / AFEST / CFA — réseau socio-économique
- **Ind. 29** : CFA uniquement — insertion professionnelle

### Indicateurs qui génèrent des preuves AU NIVEAU de chaque formation (pas seulement au niveau organisme)

| Indicateur | Libellé | Ce qu'il faut prouver PAR formation |
|-----------|---------|-------------------------------------|
| **1** | Diffusion d'informations accessibles | Programme publié avec prérequis, objectifs, durée, modalités, tarifs, accessibilité handicap |
| **2** | Indicateurs de résultats | Taux de satisfaction, réussite publiés (agrégés par formation) |
| **4** | Analyse du besoin | Traces de l'analyse des besoins (questionnaire, entretien, cahier des charges client) |
| **5** | Objectifs opérationnels | Objectifs pédagogiques formulés avec des verbes d'action et critères de réussite |
| **6** | Contenus et modalités | Programme détaillé, déroulé pédagogique, modalités (présentiel/distanciel/hybride) |
| **8** | Positionnement à l'entrée | Test de positionnement ou questionnaire d'auto-évaluation en amont |
| **9** | Information des bénéficiaires | Convocation, programme, règlement intérieur transmis avant le démarrage |
| **10** | Adaptation et accompagnement | Preuves d'ajustement en cours de formation selon les retours |
| **11** | Évaluation de l'atteinte des objectifs | Évaluations en cours et fin de formation, résultats documentés |
| **12** | Prévention des abandons | Procédure de relance, suivi des absences, actions documentées |
| **17** | Moyens humains et techniques | CV du formateur affecté, descriptif des locaux/équipements utilisés |
| **18** | Coordination des intervenants | Plannings, fiches de liaison si plusieurs intervenants |
| **19** | Ressources pédagogiques | Supports remis aux stagiaires, accès LMS/ressources |
| **21** | Compétences des intervenants | CV à jour du formateur, cohérence compétences/contenu |
| **30** | Recueil des appréciations | Questionnaires de satisfaction à chaud ET à froid |
| **31** | Traitement des réclamations | Traces de traitement si réclamation reçue |
| **32** | Amélioration continue | Actions correctives suite aux retours (au niveau formation) |

---

## 2. Vue d'ensemble du cycle de vie

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CYCLE DE VIE D'UNE FORMATION                       │
├───────────────────┬───────────────────────┬─────────────────────────────────┤
│   CONCEPTION      │    DÉPLOIEMENT        │        ÉVALUATION              │
│   (Avant J-1)     │    (J0 → J-fin)       │        (Après J-fin)           │
├───────────────────┼───────────────────────┼─────────────────────────────────┤
│ 1. Demande client │ 10. Accueil/livret    │ 16. Éval. satisfaction chaud   │
│ 2. Analyse besoin │ 11. Feuille émargement│ 17. Certificat de réalisation  │
│ 3. Programme      │ 12. Animation session │ 18. Attestation fin formation  │
│ 4. Devis/propale  │ 13. Éval. en cours    │ 19. Facturation                │
│ 5. Convention     │ 14. Suivi absences    │ 20. Envoi justif. OPCO         │
│ 6. Demande OPCO   │ 15. Adaptation tempo  │ 21. Éval. satisfaction froid   │
│ 7. Accord OPCO    │                       │ 22. Éval. acquis à froid       │
│ 8. Convocation    │                       │ 23. Bilan formateur            │
│ 9. Positionnement │                       │ 24. Archivage                  │
│                   │                       │ 25. Analyse & amélioration     │
└───────────────────┴───────────────────────┴─────────────────────────────────┘
```

---

## 3. Phase 1 — Conception (avant la formation)

### Q01 — Réception de la demande client

- **Phase** : Conception
- **Description** : Réceptionner et enregistrer la demande de formation émise par un client (entreprise, particulier ou prescripteur). Qualifier le besoin initial : thématique, nombre de stagiaires, dates souhaitées, contraintes logistiques, type de financement envisagé.
- **Documents produits** : Fiche de demande / ticket CRM
- **Responsable** : Secrétaire / Responsable commercial
- **Personnes impliquées** : Client (contact entreprise ou particulier), Secrétaire
- **Dépendances** : Aucune (point d'entrée)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : —

---

### Q02 — Analyse des besoins

- **Phase** : Conception
- **Description** : Conduire une analyse formalisée et traçable du besoin en lien avec le bénéficiaire, l'entreprise et/ou le financeur. Identifier les attentes, les compétences actuelles, les objectifs visés et les contraintes. Pour les formations intra, cela inclut souvent un entretien avec le commanditaire et/ou les futurs stagiaires. Pour les inter, un questionnaire de positionnement peut suffire.
- **Documents produits** : Compte-rendu d'entretien, grille d'analyse des besoins, questionnaire de positionnement, cahier des charges (intra)
- **Responsable** : Responsable pédagogique / Formateur
- **Personnes impliquées** : Client (commanditaire), futurs stagiaires (optionnel), Responsable pédagogique
- **Dépendances** : Q01
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **4** (non-conformité majeure si absent)

---

### Q03 — Élaboration / adaptation du programme

- **Phase** : Conception
- **Description** : Créer ou adapter le programme de formation en cohérence avec l'analyse des besoins. Le programme doit inclure : intitulé, objectifs pédagogiques (verbes d'action), public visé, prérequis, durée, contenu détaillé par séquence/module, modalités pédagogiques (présentiel/distanciel/hybride), moyens pédagogiques et techniques, modalités d'évaluation, profil du formateur, accessibilité handicap.
- **Documents produits** : Programme de formation, déroulé pédagogique (séquençage horaire)
- **Responsable** : Responsable pédagogique / Formateur
- **Personnes impliquées** : Formateur, Responsable pédagogique, Client (validation pour intra)
- **Dépendances** : Q02
- **Applicabilité** : TOUTES les formations (adaptation obligatoire pour intra, programme catalogue pour inter)
- **Indicateur Qualiopi** : **5** (objectifs), **6** (contenus et modalités)

---

### Q04 — Établissement du devis / proposition commerciale

- **Phase** : Conception
- **Description** : Rédiger et envoyer un devis détaillé au client. Doit mentionner : intitulé exact de la formation, dates de début et fin, durée en heures, nombre de stagiaires, coût pédagogique HT et TTC, frais annexes éventuels (déplacement, hébergement, supports), conditions de paiement, conditions d'annulation. Pour les formations OPCO, le devis servira de pièce justificative pour la demande de prise en charge.
- **Documents produits** : Devis signé
- **Responsable** : Secrétaire / Responsable commercial
- **Personnes impliquées** : Client, Secrétaire
- **Dépendances** : Q03
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **1** (information tarifaire)

---

### Q05 — Signature de la convention ou du contrat de formation

- **Phase** : Conception
- **Description** : Formaliser l'engagement contractuel entre l'organisme et le client.
  - **Convention de formation** (art. L.6353-1) : signée avec une personne morale (entreprise). Pas de droit de rétractation systématique.
  - **Contrat de formation** (art. L.6353-3 à L.6353-7) : signé avec une personne physique (particulier). Droit de rétractation de 10 jours.
  Le document doit mentionner : intitulé, objectifs, contenu, durée, période de réalisation, modalités de déroulement, prix, conditions de règlement, conditions de résiliation, modalités de règlement des litiges.
- **Documents produits** : Convention de formation signée (B2B) OU Contrat de formation signé (B2C)
- **Responsable** : Secrétaire / Direction
- **Personnes impliquées** : Client (signataire), Direction OF, Secrétaire
- **Dépendances** : Q04 (devis accepté)
- **Applicabilité** : TOUTES les formations (obligation légale — Code du travail)
- **Indicateur Qualiopi** : **6** (supports de contractualisation)

---

### Q06 — Demande de prise en charge OPCO

- **Phase** : Conception
- **Description** : Constituer et déposer le dossier de demande de prise en charge auprès de l'OPCO de l'entreprise cliente. Le dossier doit être déposé **au minimum 15 jours à 1 mois avant** le 1er jour de formation (certains OPCO exigent 2 mois). Le dossier comprend :
  - Formulaire de demande de prise en charge (propre à chaque OPCO)
  - Convention de formation signée
  - Programme de formation
  - Devis détaillé
  - Calendrier prévisionnel
  - Informations sur les salariés concernés
  - Choix du mode de règlement : **subrogation** (l'OPCO paie directement l'OF) ou **remboursement** (l'entreprise paie puis se fait rembourser)
- **Documents produits** : Dossier de demande de prise en charge, formulaire OPCO rempli
- **Responsable** : Client (l'entreprise est le demandeur) — mais souvent assisté par la Secrétaire de l'OF
- **Personnes impliquées** : Client (RH/Responsable formation), Secrétaire OF, OPCO
- **Dépendances** : Q05 (convention signée), Q03 (programme)
- **Applicabilité** : **OPCO uniquement**
- **Indicateur Qualiopi** : — (obligation administrative, pas directement un indicateur)
- **Délai critique** : 15 jours à 2 mois avant J0

---

### Q07 — Obtention de l'accord de prise en charge OPCO

- **Phase** : Conception
- **Description** : Réceptionner et vérifier l'accord de prise en charge émis par l'OPCO. L'accord précise le montant pris en charge, les conditions, et le mode de paiement (subrogation ou remboursement). En cas de subrogation, l'OPCO émet un **contrat de prestation de services (CPS)** à l'organisme de formation. Vérifier que le montant accordé correspond au devis. Si prise en charge partielle, informer le client du reste à charge.
- **Documents produits** : Accord de prise en charge OPCO, CPS (si subrogation)
- **Responsable** : OPCO (émetteur) → Secrétaire (réception et vérification)
- **Personnes impliquées** : OPCO, Secrétaire, Client
- **Dépendances** : Q06
- **Applicabilité** : **OPCO uniquement**
- **Indicateur Qualiopi** : —

---

### Q06-CPF — Création de la session sur EDOF (Mon Compte Formation)

- **Phase** : Conception
- **Description** : Pour les formations éligibles au CPF, créer ou ouvrir une session sur la plateforme EDOF (Espace des Organismes de Formation). Prérequis : l'offre de formation doit déjà être référencée sur EDOF (certification RNCP/RS, Qualiopi, habilitation). Définir : dates, lieu, modalités, nombre de places. Le stagiaire s'inscrit via son espace Mon Compte Formation. L'OF doit valider la demande d'inscription dans les **2 jours ouvrés**. Depuis 2023, un reste à charge de 100 € est appliqué au titulaire du CPF (sauf exceptions).
- **Documents produits** : Session créée sur EDOF, validation de l'inscription
- **Responsable** : Secrétaire / Responsable commercial
- **Personnes impliquées** : Secrétaire, Stagiaire (inscrit via MCF), Caisse des Dépôts
- **Dépendances** : Q03 (programme existant), offre référencée sur EDOF
- **Applicabilité** : **CPF uniquement**
- **Indicateur Qualiopi** : —

---

### Q08 — Envoi de la convocation

- **Phase** : Conception
- **Description** : Envoyer la convocation aux stagiaires inscrits. Bien que non strictement obligatoire légalement, elle est fortement recommandée et constitue une preuve pour l'indicateur 9 de Qualiopi. La convocation doit contenir : intitulé de la formation, dates et horaires, lieu (adresse précise ou lien de connexion si distanciel), nom du formateur, programme joint ou lien vers le programme, documents à apporter, informations pratiques (accès, parking, restauration), contact de l'OF, règlement intérieur (ou lien). Envoi recommandé **7 à 15 jours avant** le début de la formation.
- **Documents produits** : Convocation individuelle
- **Responsable** : Secrétaire
- **Personnes impliquées** : Stagiaires (destinataires), Client/RH (en copie pour intra)
- **Dépendances** : Q05 (convention signée), liste des stagiaires confirmée
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **9** (information des bénéficiaires)

---

### Q08b — Transmission du règlement intérieur

- **Phase** : Conception
- **Description** : Transmettre le règlement intérieur de l'organisme de formation aux stagiaires avant ou au début de la formation. Obligatoire dès lors que la formation dépasse 500 heures (mais fortement recommandé pour toutes). Le règlement couvre : hygiène et sécurité, discipline, représentation des stagiaires, sanctions.
- **Documents produits** : Règlement intérieur
- **Responsable** : Secrétaire
- **Personnes impliquées** : Stagiaires
- **Dépendances** : Q08
- **Applicabilité** : TOUTES les formations (obligatoire > 500h, recommandé pour toutes)
- **Indicateur Qualiopi** : **9**

---

### Q09 — Positionnement / évaluation des acquis en amont

- **Phase** : Conception
- **Description** : Mettre en œuvre une procédure formalisée de positionnement et d'évaluation des acquis à l'entrée de la formation. L'objectif est de mesurer l'écart entre le niveau actuel du stagiaire et les objectifs de la formation, pour adapter le parcours si nécessaire. Outils possibles : test en ligne (QCM, quiz), questionnaire d'auto-positionnement, entretien individuel, mise en situation, exercice pratique. Même si la formation n'exige pas de prérequis, une évaluation initiale doit être réalisée.
- **Documents produits** : Résultats du test de positionnement, questionnaire d'auto-évaluation rempli
- **Responsable** : Formateur / Responsable pédagogique
- **Personnes impliquées** : Stagiaires, Formateur
- **Dépendances** : Q08 (stagiaires convoqués/inscrits)
- **Applicabilité** : TOUTES les formations (obligatoire pour alternance/AFEST, fortement recommandé pour AF classiques)
- **Indicateur Qualiopi** : **8** (non-conformité majeure si absent)

---

### Q09b — Préparation logistique

- **Phase** : Conception
- **Description** : Préparer l'environnement de formation : réservation de salle, vérification du matériel (vidéoprojecteur, ordinateurs, paperboard, connexion internet), préparation des supports pédagogiques (impressions, accès LMS, envoi des documents préparatoires), organisation de la restauration si nécessaire, vérification de l'accessibilité PMR.
- **Documents produits** : Checklist logistique, bon de réservation de salle
- **Responsable** : Secrétaire / Responsable logistique
- **Personnes impliquées** : Formateur, Secrétaire
- **Dépendances** : Q05 (formation confirmée), Q03 (programme validé)
- **Applicabilité** : TOUTES les formations (présentiel), adaptée pour distanciel (vérification plateforme)
- **Indicateur Qualiopi** : **17** (moyens techniques)

---

### Q09c — Affectation du formateur

- **Phase** : Conception
- **Description** : Désigner le formateur (interne ou sous-traitant) et vérifier l'adéquation de ses compétences avec le contenu de la formation. Si sous-traitant : formaliser le contrat de prestation, vérifier ses qualifications (CV, diplômes, expérience), s'assurer de sa conformité Qualiopi (depuis 2024, déclaration obligatoire des sous-traitants sur EDOF pour les formations CPF).
- **Documents produits** : Ordre de mission formateur, contrat de prestation (si sous-traitant), CV à jour du formateur
- **Responsable** : Direction / Responsable pédagogique
- **Personnes impliquées** : Formateur, Direction
- **Dépendances** : Q03 (programme défini)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **17** (moyens humains), **21** (compétences des intervenants), **27** (si sous-traitance)

---

## 4. Phase 2 — Déploiement (pendant la formation)

### Q10 — Accueil des stagiaires et livret d'accueil

- **Phase** : Déploiement
- **Description** : Accueillir les stagiaires le premier jour. Tour de table, présentation du programme, des objectifs, des modalités d'évaluation, des règles de fonctionnement. Remise du livret d'accueil (si applicable) contenant : programme détaillé, contacts utiles, règlement intérieur, informations pratiques, modalités de réclamation. Faire signer la feuille d'émargement du jour. Recueillir les attentes des participants (peut être fait oralement ou par écrit).
- **Documents produits** : Livret d'accueil, feuille d'émargement J1 signée, fiche de recueil des attentes
- **Responsable** : Formateur
- **Personnes impliquées** : Stagiaires, Formateur, Secrétaire (accueil physique)
- **Dépendances** : Q08 (convocations envoyées), Q09b (logistique prête)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **9** (information des bénéficiaires), **10** (adaptation)

---

### Q11 — Émargement quotidien

- **Phase** : Déploiement
- **Description** : Faire signer les feuilles de présence (émargement) par chaque stagiaire et par le formateur, **deux fois par jour** (matin et après-midi). C'est l'obligation légale fondamentale (art. R.6313-3 du Code du travail) pour justifier la réalité de la prestation. Pour les formations à distance, un système de traçabilité équivalent doit être mis en place (connexion horodatée, plateforme LMS avec logs, émargement électronique).
- **Documents produits** : Feuilles d'émargement signées (par demi-journée)
- **Responsable** : Formateur (fait signer), Secrétaire (archivage)
- **Personnes impliquées** : Stagiaires, Formateur
- **Dépendances** : Q10 (formation démarrée)
- **Applicabilité** : TOUTES les formations (obligation légale)
- **Indicateur Qualiopi** : preuve transversale pour les indicateurs 11, 17, 30

---

### Q12 — Animation pédagogique

- **Phase** : Déploiement
- **Description** : Dérouler le contenu pédagogique conformément au programme et au déroulé pédagogique prévu. Adapter le rythme et les méthodes en fonction du groupe. Utiliser les moyens pédagogiques prévus (supports, exercices, mises en situation, études de cas). Documenter tout écart significatif par rapport au programme prévu (et justifier l'adaptation).
- **Documents produits** : Supports pédagogiques utilisés, notes du formateur sur les adaptations
- **Responsable** : Formateur
- **Personnes impliquées** : Stagiaires, Formateur
- **Dépendances** : Q10
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **6** (contenus et modalités), **10** (adaptation), **19** (ressources pédagogiques)

---

### Q13 — Évaluations en cours de formation (formatives)

- **Phase** : Déploiement
- **Description** : Mettre en œuvre des évaluations formatives tout au long de la formation pour vérifier la progression des stagiaires et l'acquisition des compétences intermédiaires. Outils : quiz, QCM, exercices pratiques, mises en situation, études de cas, travaux de groupe, auto-évaluation. Documenter les résultats. En cas de difficultés identifiées, adapter le parcours (indicateur 10).
- **Documents produits** : Résultats des évaluations formatives, grille d'évaluation
- **Responsable** : Formateur
- **Personnes impliquées** : Stagiaires, Formateur
- **Dépendances** : Q12
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **11** (évaluation de l'atteinte des objectifs — non-conformité majeure si absent)

---

### Q14 — Suivi des absences et prévention des abandons

- **Phase** : Déploiement
- **Description** : Surveiller la présence des stagiaires via les feuilles d'émargement. En cas d'absence non justifiée : relancer le stagiaire (téléphone, email), informer l'entreprise cliente et/ou le financeur. Pour les formations longues (> 2 jours) : mettre en place des entretiens de suivi, des bilans intermédiaires, des dispositifs de remotivation. Documenter toutes les actions de relance et d'accompagnement.
- **Documents produits** : Registre de suivi des absences, traces de relances (emails, appels), compte-rendu d'entretien de suivi
- **Responsable** : Secrétaire (suivi administratif) + Formateur (suivi pédagogique)
- **Personnes impliquées** : Stagiaires, Formateur, Secrétaire, Client/RH
- **Dépendances** : Q11 (émargements)
- **Applicabilité** : TOUTES les formations (obligatoire pour formations > 2 jours, recommandé pour toutes)
- **Indicateur Qualiopi** : **12** (prévention des abandons)

---

### Q15 — Adaptation en cours de formation

- **Phase** : Déploiement
- **Description** : Ajuster le déroulement de la formation en fonction des retours des stagiaires, des résultats des évaluations formatives, ou de besoins non identifiés en amont. Cela peut inclure : ralentir ou accélérer le rythme, approfondir un sujet, modifier les exercices, adapter les supports. Documenter ces adaptations et les justifier.
- **Documents produits** : Notes d'adaptation, version modifiée du déroulé si nécessaire
- **Responsable** : Formateur
- **Personnes impliquées** : Stagiaires, Formateur, Responsable pédagogique (si modification majeure)
- **Dépendances** : Q13 (résultats des évaluations)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **10** (adaptation et accompagnement)

---

## 5. Phase 3 — Évaluation (après la formation)

### Q16 — Évaluation de satisfaction à chaud

- **Phase** : Évaluation
- **Description** : Administrer un questionnaire de satisfaction aux stagiaires **immédiatement à la fin de la formation** (dernière heure ou dans les 24-48h). Le questionnaire doit couvrir : clarté des objectifs, qualité de l'animation, pertinence des supports, adéquation du contenu aux attentes, conditions matérielles (locaux, équipements), satisfaction globale, commentaires libres (questions ouvertes obligatoires pour Qualiopi). Collecter également l'avis du formateur sur la session.
- **Documents produits** : Questionnaires de satisfaction à chaud remplis, synthèse des résultats
- **Responsable** : Secrétaire (envoi/collecte) + Formateur (distribution en salle)
- **Personnes impliquées** : Stagiaires, Formateur, Secrétaire
- **Dépendances** : Fin de la formation (Q12 terminée)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **30** (recueil des appréciations — non-conformité majeure si absent)

---

### Q16b — Évaluation des acquis en fin de formation (sommative)

- **Phase** : Évaluation
- **Description** : Évaluer l'atteinte des objectifs pédagogiques par chaque stagiaire en fin de formation. Comparer avec le positionnement initial (Q09). Outils : test final (QCM, cas pratique, mise en situation), grille d'évaluation des compétences acquises, auto-évaluation comparative (avant/après). Les résultats doivent être documentés individuellement.
- **Documents produits** : Résultats de l'évaluation finale, comparatif positionnement initial/final
- **Responsable** : Formateur
- **Personnes impliquées** : Stagiaires, Formateur
- **Dépendances** : Q09 (positionnement initial), fin de formation
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **11** (évaluation de l'atteinte des objectifs)

---

### Q17 — Établissement du certificat de réalisation

- **Phase** : Évaluation
- **Description** : Établir le certificat de réalisation pour chaque stagiaire. Document administratif obligatoire (art. R.6332-26 du Code du travail) destiné à l'entreprise et aux financeurs pour justifier la réalisation effective de l'action de formation. Le certificat doit préciser : identité du bénéficiaire, nature de l'action, dates de début et de fin, durée effective. Un modèle officiel est fourni par le ministère du Travail. Pour les formations multimodales, un modèle spécifique prenant en compte le temps des activités pédagogiques à distance est disponible.
- **Documents produits** : Certificat de réalisation (un par stagiaire)
- **Responsable** : Secrétaire
- **Personnes impliquées** : Direction (signature), Client/RH (destinataire), OPCO (destinataire si financement OPCO)
- **Dépendances** : Q11 (émargements complets)
- **Applicabilité** : TOUTES les formations (obligatoire)
- **Indicateur Qualiopi** : preuve transversale

---

### Q18 — Remise de l'attestation de fin de formation

- **Phase** : Évaluation
- **Description** : Remettre une attestation de fin de formation à chaque stagiaire. Contrairement au certificat de réalisation (destiné au financeur), l'attestation est destinée au stagiaire et doit refléter les acquis réels. Elle doit mentionner : identité du stagiaire, intitulé de la formation, dates, durée, objectifs visés, compétences acquises ou connaissances développées, résultats de l'évaluation (le cas échéant). Ne pas remettre l'attestation avant la fin de la formation (elle doit refléter ce qui a réellement été acquis).
- **Documents produits** : Attestation de fin de formation (une par stagiaire)
- **Responsable** : Secrétaire / Direction
- **Personnes impliquées** : Stagiaires (destinataires), Formateur (input sur les acquis)
- **Dépendances** : Q16b (évaluation des acquis), Q17 (certificat de réalisation)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **11**

---

### Q19 — Facturation

- **Phase** : Évaluation
- **Description** : Émettre la facture de la formation. Le destinataire et les modalités dépendent du mode de financement :
  - **Financement entreprise direct** : facture à l'entreprise cliente selon les termes de la convention.
  - **OPCO avec subrogation** : facture adressée directement à l'OPCO, avec les références du dossier de prise en charge et le numéro d'accord. L'OPCO paie dans un délai de 30 à 45 jours après réception des justificatifs.
  - **OPCO sans subrogation (remboursement)** : facture à l'entreprise qui demandera ensuite le remboursement à l'OPCO.
  - **CPF** : facturation dématérialisée via EDOF — saisie du montant HT/TTC et du numéro de facture directement dans la plateforme. Paiement par la Caisse des Dépôts dans les 30 jours calendaires.
  - **Particulier autofinancé** : facture à la personne physique.
- **Documents produits** : Facture
- **Responsable** : Secrétaire / Comptable
- **Personnes impliquées** : Client ou OPCO ou Caisse des Dépôts (destinataire)
- **Dépendances** : Q17 (certificat de réalisation établi)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : —

---

### Q20 — Envoi des justificatifs au financeur (OPCO / CPF)

- **Phase** : Évaluation
- **Description** : Constituer et transmettre le dossier de justificatifs au financeur pour obtenir le paiement (subrogation) ou permettre le remboursement de l'entreprise.
  - **Pour l'OPCO** : certificat de réalisation, feuilles d'émargement, facture, programme réalisé. Certains OPCO demandent également les résultats de l'évaluation.
  - **Pour le CPF (EDOF)** : déclarer le « service fait » (réalisation totale ou partielle) sur la plateforme EDOF. La Caisse des Dépôts vérifie et procède au règlement.
- **Documents produits** : Dossier de justificatifs (compilation), déclaration de service fait (EDOF)
- **Responsable** : Secrétaire
- **Personnes impliquées** : OPCO ou Caisse des Dépôts (destinataire), Secrétaire
- **Dépendances** : Q17 (certificat de réalisation), Q11 (émargements), Q19 (facture)
- **Applicabilité** : **OPCO et CPF uniquement**
- **Indicateur Qualiopi** : —

---

### Q21 — Évaluation de satisfaction à froid

- **Phase** : Évaluation
- **Description** : Envoyer un questionnaire de satisfaction à froid aux stagiaires **1 à 3 mois après la fin de la formation**. L'objectif est de mesurer l'impact réel et durable de la formation sur les pratiques professionnelles. Le questionnaire doit évaluer : l'application des compétences acquises dans le travail quotidien, l'impact sur la performance, les freins à la mise en œuvre, les besoins complémentaires identifiés. Prévoir un dispositif de relance pour maximiser le taux de réponse. Envoyer également un questionnaire au commanditaire (entreprise) et/ou au financeur.
- **Documents produits** : Questionnaire de satisfaction à froid rempli, synthèse des résultats
- **Responsable** : Secrétaire (envoi/relance) + Responsable pédagogique (analyse)
- **Personnes impliquées** : Stagiaires (anciens), Client/RH, Financeur (optionnel)
- **Dépendances** : Q16 (satisfaction à chaud réalisée), délai de 1 à 3 mois post-formation
- **Applicabilité** : TOUTES les formations (fortement recommandé, exigé par Qualiopi pour l'ensemble des parties prenantes)
- **Indicateur Qualiopi** : **30** (recueil des appréciations)

---

### Q22 — Évaluation des acquis à froid (transfert)

- **Phase** : Évaluation
- **Description** : Évaluer si les compétences acquises pendant la formation sont effectivement utilisées en situation de travail, **3 à 6 mois après la formation**. Outils : questionnaire au stagiaire et à son manager, entretien de suivi, observation en situation de travail. Cette évaluation n'est pas strictement obligatoire pour toutes les formations mais constitue une bonne pratique très valorisée lors des audits Qualiopi.
- **Documents produits** : Résultats de l'évaluation de transfert
- **Responsable** : Responsable pédagogique
- **Personnes impliquées** : Stagiaires (anciens), Managers, Responsable pédagogique
- **Dépendances** : Q21 (satisfaction à froid réalisée), délai de 3 à 6 mois
- **Applicabilité** : Recommandé pour TOUTES les formations, particulièrement valorisé pour les formations longues et les formations intra
- **Indicateur Qualiopi** : **11** (évaluation de l'atteinte des objectifs), **32** (amélioration continue)

---

### Q23 — Bilan du formateur

- **Phase** : Évaluation
- **Description** : Le formateur rédige un bilan de session documentant : le déroulement de la formation, les points forts et points faibles, les adaptations réalisées, les incidents éventuels, les recommandations pour les futures sessions, l'évaluation globale du groupe. Ce bilan est un input essentiel pour l'amélioration continue (indicateur 32).
- **Documents produits** : Bilan de session / rapport formateur
- **Responsable** : Formateur
- **Personnes impliquées** : Formateur, Responsable pédagogique
- **Dépendances** : Fin de la formation
- **Applicabilité** : TOUTES les formations (bonne pratique Qualiopi)
- **Indicateur Qualiopi** : **30** (appréciations de l'équipe pédagogique), **32** (amélioration continue)

---

### Q24 — Archivage du dossier de formation

- **Phase** : Évaluation
- **Description** : Constituer et archiver le dossier complet de la formation. Tous les documents doivent être conservés pour les audits Qualiopi (cycle de 3 ans) et les contrôles éventuels. Durées de conservation :
  - Conventions / contrats de formation : **5 à 10 ans**
  - Feuilles d'émargement : **3 ans minimum** (5 ans recommandé)
  - Certificats de réalisation : **5 ans minimum**
  - Évaluations et questionnaires de satisfaction : **3 ans**
  - Supports pédagogiques : durée du cycle Qualiopi (3 ans)
  - Preuves de formation à distance : **3 ans après l'année de mise en œuvre**
  - Documents comptables (factures) : **10 ans**
- **Documents produits** : Dossier archivé (physique et/ou numérique)
- **Responsable** : Secrétaire
- **Personnes impliquées** : Secrétaire
- **Dépendances** : Tous les documents de la formation produits et collectés
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : preuve transversale pour tous les indicateurs

---

### Q25 — Analyse des retours et amélioration continue

- **Phase** : Évaluation
- **Description** : Analyser l'ensemble des retours collectés (satisfaction à chaud, satisfaction à froid, bilan formateur, évaluations des acquis, réclamations éventuelles) et en tirer des actions d'amélioration concrètes. Mettre à jour le programme de formation si nécessaire. Alimenter le tableau de bord qualité de l'organisme. Cette étape est cruciale pour le renouvellement Qualiopi : l'auditeur vérifie que les retours sont effectivement utilisés pour améliorer les prestations.
- **Documents produits** : Fiche d'amélioration, plan d'actions correctives, mise à jour du programme (si applicable)
- **Responsable** : Responsable pédagogique / Responsable qualité
- **Personnes impliquées** : Responsable pédagogique, Direction, Formateur
- **Dépendances** : Q16 + Q21 + Q23 (tous les retours collectés)
- **Applicabilité** : TOUTES les formations
- **Indicateur Qualiopi** : **32** (amélioration continue — non-conformité majeure si absent)

---

## 6. Spécificités par type de financement

### 6.1. Formations financées par un OPCO

| Étape supplémentaire | Moment | Description |
|----------------------|--------|-------------|
| **Q06 — Demande de prise en charge** | Avant la formation (15j à 2 mois avant J0) | Constitution du dossier : convention, programme, devis, formulaire OPCO, infos salariés |
| **Q07 — Accord de prise en charge** | Avant la formation | Réception de l'accord, vérification du montant, CPS si subrogation |
| **Q20 — Justificatifs post-formation** | Après la formation | Envoi : certificat de réalisation, émargements, facture à l'OPCO |
| **Facturation spécifique** | Après la formation | Si subrogation : facture à l'OPCO. Si remboursement : facture à l'entreprise |

**Documents supplémentaires requis :**
- Formulaire de demande de prise en charge (propre à chaque OPCO)
- Accord de prise en charge
- CPS (contrat de prestation de services) en cas de subrogation
- Certificat de réalisation (modèle officiel ministère du Travail)

**Points d'attention :**
- Le dossier doit être déposé AVANT le début de la formation
- Le montant facturé doit correspondre exactement au montant de l'accord de prise en charge
- Conserver toutes les pièces pendant 5 ans minimum (contrôles OPCO possibles)

### 6.2. Formations financées par le CPF

| Étape supplémentaire | Moment | Description |
|----------------------|--------|-------------|
| **Référencement EDOF** | Préalable (niveau organisme) | Offre de formation référencée sur EDOF avec certification éligible |
| **Q06-CPF — Création session EDOF** | Avant la formation | Création de la session, dates, lieux, places |
| **Validation inscription** | Avant la formation | Validation sous 2 jours ouvrés de la demande du stagiaire |
| **Déclaration service fait** | Après la formation | Sur EDOF, déclarer la réalisation (totale ou partielle) |
| **Facturation EDOF** | Après la formation | Saisie dématérialisée dans EDOF, paiement par CDC en 30 jours |

**Documents supplémentaires requis :**
- Offre référencée sur EDOF (avec habilitation du certificateur)
- Déclaration annuelle des sous-traitants (depuis avril 2024)
- Service fait déclaré sur EDOF

**Points d'attention :**
- Reste à charge de 100 € pour le titulaire du CPF (depuis 2023, sauf exceptions)
- La formation doit être certifiante (RNCP ou Répertoire Spécifique)
- Contrôles renforcés de la Caisse des Dépôts (convention anti-fraude 2025)
- Volume de sous-traitance limité à 80 % du CA sur MCF
- Toute erreur de saisie peut entraîner un rejet ou un signalement

### 6.3. Formations autofinancées (sans financement public)

**Ce qui peut être allégé :**
- Pas de demande de prise en charge (Q06/Q07)
- Pas de déclaration de service fait sur EDOF
- Pas de certificat de réalisation au format ministériel (mais recommandé)
- Pas de contrainte de délai de dépôt de dossier

**Ce qui reste obligatoire :**
- Convention de formation (B2B) ou contrat de formation (B2C)
- Programme de formation
- Feuilles d'émargement
- Évaluation des acquis
- Questionnaires de satisfaction (Qualiopi)
- Attestation de fin de formation
- Facture
- Toutes les obligations Qualiopi restent applicables

---

## 7. Spécificités par type de formation

### 7.1. Formation Intra-entreprise

| Caractéristique | Détail |
|----------------|--------|
| **Client** | Une seule entreprise |
| **Contenu** | Personnalisé / sur-mesure |
| **Lieu** | Locaux de l'entreprise, de l'OF, ou à distance |
| **Dates** | À la convenance du client |
| **Tarification** | Forfait global (pas de prix par participant) |
| **Convention** | Une seule convention avec l'entreprise |
| **Analyse des besoins** | Approfondie, avec entretien commanditaire, cahier des charges, adaptation du programme |
| **Programme** | Adapté spécifiquement (version "sur-mesure") |
| **Convocation** | Souvent gérée par le client (RH envoie aux salariés), mais l'OF peut aussi l'envoyer |
| **Feuille d'émargement** | Tous les stagiaires d'une même entreprise |

**Spécificités administratives :**
- Q02 (analyse des besoins) plus approfondie : entretien avec le commanditaire, visite des locaux si la formation a lieu chez le client
- Q03 (programme) : version sur-mesure obligatoire, validée par le client
- Convention de mise à disposition possible si le client fournit du matériel ou des locaux
- Une seule convention, un seul interlocuteur

### 7.2. Formation Inter-entreprise

| Caractéristique | Détail |
|----------------|--------|
| **Clients** | Plusieurs entreprises / particuliers |
| **Contenu** | Programme catalogue standardisé |
| **Lieu** | Locaux de l'OF |
| **Dates** | Planifiées par l'OF (calendrier catalogue) |
| **Tarification** | Prix par participant |
| **Convention** | Une convention PAR entreprise (ou contrat par particulier) |
| **Analyse des besoins** | Plus légère (questionnaire de positionnement) |
| **Programme** | Catalogue standard |
| **Convocation** | Envoyée par l'OF à chaque stagiaire |
| **Feuille d'émargement** | Stagiaires de différentes entreprises mélangés |

**Spécificités administratives :**
- Multiplication des documents : une convention par entreprise, une demande OPCO par entreprise
- Gestion des inscriptions plus complexe (seuil minimum de participants, liste d'attente)
- Possibilité d'annulation si nombre minimum non atteint
- Un certificat de réalisation par stagiaire mais des entreprises/OPCO différents comme destinataires
- Facturation individuelle par entreprise/participant

---

## 8. Récapitulatif des documents

### Documents contractuels et commerciaux

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Fiche de demande / qualification | Conception | OF | Interne | Non (bonne pratique) |
| Devis | Conception | OF | Client | Oui (commercial) |
| Convention de formation | Conception | OF | Entreprise (B2B) | Oui (légal) |
| Contrat de formation | Conception | OF | Particulier (B2C) | Oui (légal, si B2C) |
| Facture | Évaluation | OF | Client / OPCO / CDC | Oui (légal) |

### Documents pédagogiques

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Analyse des besoins / cahier des charges | Conception | OF + Client | Interne | Oui (Qualiopi ind. 4) |
| Programme de formation | Conception | OF | Client, stagiaires, OPCO | Oui (légal + Qualiopi) |
| Déroulé pédagogique | Conception | Formateur | Interne | Oui (Qualiopi ind. 6) |
| Test de positionnement | Conception | Formateur / OF | Stagiaires | Oui (Qualiopi ind. 8) |
| Supports pédagogiques | Déploiement | Formateur | Stagiaires | Oui (Qualiopi ind. 19) |
| Évaluations formatives | Déploiement | Formateur | Stagiaires | Oui (Qualiopi ind. 11) |
| Évaluation sommative (fin) | Évaluation | Formateur | Stagiaires | Oui (Qualiopi ind. 11) |

### Documents de suivi

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Convocation | Conception | OF | Stagiaires | Recommandé (Qualiopi ind. 9) |
| Règlement intérieur | Conception | OF | Stagiaires | Oui (légal si > 500h, recommandé toujours) |
| Livret d'accueil | Déploiement | OF | Stagiaires | Recommandé (Qualiopi ind. 9) |
| Feuille d'émargement | Déploiement | OF | Archivage OF, OPCO | Oui (légal — art. R.6313-3) |
| Registre de suivi des absences | Déploiement | OF | Interne | Oui (Qualiopi ind. 12) |

### Documents de fin de formation

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Questionnaire satisfaction à chaud | Évaluation | OF | Stagiaires → OF | Oui (Qualiopi ind. 30) |
| Certificat de réalisation | Évaluation | OF | Entreprise, OPCO, financeur | Oui (légal — art. R.6332-26) |
| Attestation de fin de formation | Évaluation | OF | Stagiaire | Oui (légal + Qualiopi ind. 11) |
| Bilan formateur | Évaluation | Formateur | Interne OF | Recommandé (Qualiopi ind. 30, 32) |
| Questionnaire satisfaction à froid | Évaluation (+1-3 mois) | OF | Stagiaires, clients → OF | Oui (Qualiopi ind. 30) |
| Évaluation transfert (acquis à froid) | Évaluation (+3-6 mois) | OF | Stagiaires, managers | Recommandé (Qualiopi ind. 11, 32) |
| Fiche d'amélioration | Évaluation | OF | Interne | Oui (Qualiopi ind. 32) |

### Documents spécifiques OPCO

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Formulaire de demande de prise en charge | Conception | Entreprise (assistée par OF) | OPCO | Oui (OPCO) |
| Accord de prise en charge | Conception | OPCO | Entreprise + OF | Oui (OPCO) |
| CPS (contrat de prestation de services) | Conception | OPCO | OF (si subrogation) | Si subrogation |
| Dossier justificatifs post-formation | Évaluation | OF | OPCO | Oui (OPCO) |

### Documents spécifiques CPF

| Document | Moment | Émetteur | Destinataire | Obligatoire |
|----------|--------|----------|-------------|-------------|
| Session EDOF | Conception | OF | EDOF / MCF | Oui (CPF) |
| Validation inscription | Conception | OF | Stagiaire / CDC | Oui (CPF, sous 2j) |
| Déclaration de service fait | Évaluation | OF | EDOF / CDC | Oui (CPF) |
| Facture dématérialisée EDOF | Évaluation | OF | CDC | Oui (CPF) |

---

## 9. Matrice des dépendances

```
Q01 (Demande client)
 └── Q02 (Analyse des besoins)
      └── Q03 (Programme)
           ├── Q04 (Devis)
           │    └── Q05 (Convention/Contrat)
           │         ├── Q06 (Demande OPCO)        [OPCO uniquement]
           │         │    └── Q07 (Accord OPCO)     [OPCO uniquement]
           │         ├── Q06-CPF (Session EDOF)     [CPF uniquement]
           │         ├── Q08 (Convocation)
           │         │    ├── Q08b (Règlement intérieur)
           │         │    └── Q09 (Positionnement)
           │         └── Q09b (Préparation logistique)
           └── Q09c (Affectation formateur)

     [DÉBUT DE LA FORMATION]

Q10 (Accueil + livret)
 └── Q11 (Émargement quotidien)  ←──── se répète chaque jour
      ├── Q12 (Animation pédagogique)
      │    └── Q13 (Évaluations formatives)
      │         └── Q15 (Adaptation)
      └── Q14 (Suivi absences / prévention abandons)

     [FIN DE LA FORMATION]

Q16 (Satisfaction à chaud)  ←──── en parallèle avec Q16b
Q16b (Évaluation acquis fin)
 └── Q17 (Certificat de réalisation)
      ├── Q18 (Attestation de fin de formation)
      └── Q19 (Facturation)
           └── Q20 (Justificatifs OPCO/CPF)  [OPCO/CPF uniquement]

     [+1 à 3 MOIS]

Q21 (Satisfaction à froid)

     [+3 à 6 MOIS]

Q22 (Évaluation acquis à froid / transfert)

     [TRANSVERSAL]

Q23 (Bilan formateur)        ←──── dès la fin de formation
Q24 (Archivage)              ←──── quand tout est collecté
Q25 (Analyse & amélioration) ←──── après Q16 + Q21 + Q23
```

### Dépendances critiques (bloquantes)

| Quête | Bloquée par | Raison |
|-------|------------|--------|
| Q03 (Programme) | Q02 (Analyse besoins) | Le programme doit répondre aux besoins identifiés |
| Q05 (Convention) | Q04 (Devis accepté) | La convention formalise ce qui est convenu dans le devis |
| Q06 (Demande OPCO) | Q05 (Convention signée) | La convention est une pièce obligatoire du dossier OPCO |
| Q08 (Convocation) | Q05 (Convention signée) + liste stagiaires | On ne convoque pas sans engagement contractuel |
| Q10 (Accueil) | Q08 (Convocation) + Q09b (Logistique) | Les stagiaires doivent être convoqués et la salle prête |
| Q17 (Certificat réalisation) | Q11 (Émargements complets) | Le certificat atteste de la réalisation effective |
| Q18 (Attestation) | Q16b (Évaluation acquis) | L'attestation doit refléter les acquis réels |
| Q19 (Facture) | Q17 (Certificat réalisation) | On ne facture qu'après avoir prouvé la réalisation |
| Q20 (Justif. OPCO) | Q17 + Q19 | Le dossier OPCO nécessite certificat + facture |
| Q25 (Amélioration) | Q16 + Q21 + Q23 | L'analyse nécessite tous les retours collectés |

---

## 10. Liste complète des quêtes

### Format de référence pour l'implémentation

```
id: identifiant unique (Q01, Q02, etc.)
name: nom en français
phase: CONCEPTION | DÉPLOIEMENT | ÉVALUATION
description: ce qui doit être fait
documents: documents à produire ou collecter
responsible: rôle principal responsable
involved: autres rôles impliqués
dependencies: quêtes prérequises
applicability: ALL | OPCO | CPF | INTRA | INTER | conditions spécifiques
qualiopi_indicators: indicateurs Qualiopi couverts
timing: quand cette quête doit être réalisée
is_critical: si l'absence constitue un risque de non-conformité majeure
```

### Tableau récapitulatif

| ID | Nom | Phase | Responsable | Applicabilité | Ind. Qualiopi | Critique |
|----|-----|-------|-------------|---------------|--------------|----------|
| Q01 | Réception de la demande client | CONCEPTION | Secrétaire | ALL | — | Non |
| Q02 | Analyse des besoins | CONCEPTION | Resp. pédagogique | ALL | 4 | **Oui** |
| Q03 | Élaboration / adaptation du programme | CONCEPTION | Resp. pédagogique | ALL | 5, 6 | **Oui** |
| Q04 | Établissement du devis | CONCEPTION | Secrétaire | ALL | 1 | Non |
| Q05 | Signature convention / contrat | CONCEPTION | Secrétaire | ALL | 6 | **Oui** |
| Q06 | Demande de prise en charge OPCO | CONCEPTION | Client (assisté OF) | OPCO | — | Non |
| Q07 | Accord de prise en charge OPCO | CONCEPTION | OPCO | OPCO | — | Non |
| Q06-CPF | Création session EDOF | CONCEPTION | Secrétaire | CPF | — | Non |
| Q08 | Envoi de la convocation | CONCEPTION | Secrétaire | ALL | 9 | Non |
| Q08b | Transmission règlement intérieur | CONCEPTION | Secrétaire | ALL | 9 | Non |
| Q09 | Positionnement / évaluation amont | CONCEPTION | Formateur | ALL | 8 | **Oui** |
| Q09b | Préparation logistique | CONCEPTION | Secrétaire | ALL | 17 | Non |
| Q09c | Affectation du formateur | CONCEPTION | Direction | ALL | 17, 21, 27 | Non |
| Q10 | Accueil des stagiaires | DÉPLOIEMENT | Formateur | ALL | 9, 10 | Non |
| Q11 | Émargement quotidien | DÉPLOIEMENT | Formateur | ALL | (transversal) | **Oui** |
| Q12 | Animation pédagogique | DÉPLOIEMENT | Formateur | ALL | 6, 10, 19 | Non |
| Q13 | Évaluations formatives | DÉPLOIEMENT | Formateur | ALL | 11 | **Oui** |
| Q14 | Suivi absences / prévention abandons | DÉPLOIEMENT | Secrétaire + Formateur | ALL | 12 | Non |
| Q15 | Adaptation en cours de formation | DÉPLOIEMENT | Formateur | ALL | 10 | Non |
| Q16 | Évaluation satisfaction à chaud | ÉVALUATION | Secrétaire | ALL | 30 | **Oui** |
| Q16b | Évaluation acquis fin de formation | ÉVALUATION | Formateur | ALL | 11 | **Oui** |
| Q17 | Certificat de réalisation | ÉVALUATION | Secrétaire | ALL | (transversal) | **Oui** |
| Q18 | Attestation de fin de formation | ÉVALUATION | Secrétaire | ALL | 11 | **Oui** |
| Q19 | Facturation | ÉVALUATION | Secrétaire | ALL | — | Non |
| Q20 | Envoi justificatifs au financeur | ÉVALUATION | Secrétaire | OPCO, CPF | — | Non |
| Q21 | Évaluation satisfaction à froid | ÉVALUATION | Secrétaire | ALL | 30 | **Oui** |
| Q22 | Évaluation acquis à froid (transfert) | ÉVALUATION | Resp. pédagogique | ALL (recommandé) | 11, 32 | Non |
| Q23 | Bilan du formateur | ÉVALUATION | Formateur | ALL | 30, 32 | Non |
| Q24 | Archivage du dossier | ÉVALUATION | Secrétaire | ALL | (transversal) | **Oui** |
| Q25 | Analyse & amélioration continue | ÉVALUATION | Resp. qualité | ALL | 32 | **Oui** |

### Statistiques

- **Total quêtes** : 30 (Q01–Q25 + Q06-CPF, Q08b, Q09b, Q09c, Q16b)
- **Phase Conception** : 13 quêtes
- **Phase Déploiement** : 6 quêtes
- **Phase Évaluation** : 11 quêtes (dont 2 différées à +1-3 mois et +3-6 mois)
- **Quêtes critiques (risque non-conformité majeure)** : 13 (Q02, Q03, Q05, Q09, Q11, Q13, Q16, Q16b, Q17, Q18, Q21, Q24, Q25)
- **Quêtes spécifiques OPCO** : 3 (Q06, Q07, Q20)
- **Quêtes spécifiques CPF** : 2 (Q06-CPF, Q20)
- **Quêtes applicables à TOUTES les formations** : 26

---

## Annexe A — Rôles impliqués

| Rôle | Description | Quêtes principales |
|------|-------------|-------------------|
| **Secrétaire / Assistante de formation** | Pilier administratif. Gère les inscriptions, les documents, la logistique, la facturation, l'archivage | Q01, Q04, Q05, Q06, Q08, Q08b, Q09b, Q11 (archivage), Q14, Q16, Q17, Q18, Q19, Q20, Q21, Q24 |
| **Responsable pédagogique** | Conçoit les programmes, supervise la qualité pédagogique, analyse les retours | Q02, Q03, Q09, Q22, Q25 |
| **Formateur** | Anime la formation, évalue les stagiaires, rédige le bilan | Q03, Q09, Q09c, Q10, Q11, Q12, Q13, Q14, Q15, Q16b, Q23 |
| **Direction / Responsable d'organisme** | Signe les conventions, valide les affectations, supervise la conformité | Q05, Q09c, Q18 |
| **Responsable qualité** | Pilote l'amélioration continue, prépare les audits Qualiopi | Q25 |
| **Client / Commanditaire (Entreprise)** | Exprime le besoin, signe la convention, transmet les infos OPCO | Q01, Q02, Q04, Q05, Q06 |
| **Stagiaires / Apprenants** | Participent à la formation, signent les émargements, répondent aux évaluations | Q09, Q10, Q11, Q13, Q16, Q16b, Q21 |
| **OPCO** | Finance la formation, vérifie le service fait, paie l'OF ou rembourse l'entreprise | Q06, Q07, Q20 |
| **Caisse des Dépôts (CDC)** | Gère les fonds CPF, vérifie et règle via EDOF | Q06-CPF, Q20 |

---

## Annexe B — Mapping Qualiopi → Quêtes

| Indicateur | Libellé court | Quêtes couvrant cet indicateur |
|-----------|---------------|-------------------------------|
| 1 | Information du public | Q04 |
| 2 | Indicateurs de résultats | Q16, Q21, Q25 |
| 4 | Analyse du besoin | **Q02** |
| 5 | Objectifs opérationnels | **Q03** |
| 6 | Contenus et modalités | **Q03**, Q05, Q12 |
| 8 | Positionnement à l'entrée | **Q09** |
| 9 | Information des bénéficiaires | Q08, Q08b, Q10 |
| 10 | Adaptation et accompagnement | Q10, Q12, Q15 |
| 11 | Évaluation atteinte objectifs | **Q13**, **Q16b**, Q18, Q22 |
| 12 | Prévention des abandons | Q14 |
| 17 | Moyens humains et techniques | Q09b, Q09c |
| 18 | Coordination des intervenants | (niveau organisme + Q09c si multi-formateurs) |
| 19 | Ressources pédagogiques | Q12 |
| 21 | Compétences des intervenants | Q09c |
| 22 | Développement des compétences | (niveau organisme) |
| 23-25 | Veille | (niveau organisme) |
| 26 | Accompagnement handicap | Q02, Q03, Q08, Q09b |
| 27 | Sous-traitance | Q09c (si formateur sous-traitant) |
| 30 | Recueil des appréciations | **Q16**, **Q21**, Q23 |
| 31 | Traitement des réclamations | (niveau organisme, déclenché ad hoc) |
| 32 | Amélioration continue | **Q25**, Q22 |

**Légende** : Les indicateurs en **gras** dans la colonne "Quêtes" indiquent un risque de non-conformité majeure.

---

## Annexe C — Timeline type d'une formation de 2 jours (Inter, OPCO)

| Quand | Quête | Action |
|-------|-------|--------|
| J-90 | Q01 | Réception demande client |
| J-80 | Q02 | Analyse des besoins (questionnaire) |
| J-70 | Q03 | Programme catalogue vérifié/adapté |
| J-60 | Q04 | Envoi du devis |
| J-55 | Q04 | Devis accepté |
| J-50 | Q05 | Convention signée |
| J-45 | Q06 | Dépôt dossier OPCO |
| J-30 | Q07 | Réception accord OPCO |
| J-20 | Q09c | Affectation formateur confirmée |
| J-15 | Q08 + Q08b | Envoi convocation + règlement intérieur |
| J-10 | Q09 | Envoi test de positionnement |
| J-5 | Q09b | Vérification logistique (salle, matériel) |
| J-3 | Q09 | Réception résultats positionnement |
| **J0 matin** | Q10 | Accueil, tour de table, livret |
| **J0 matin** | Q11 | Émargement AM |
| **J0** | Q12 | Animation module 1 |
| **J0** | Q13 | Quiz intermédiaire |
| **J0 après-midi** | Q11 | Émargement PM |
| **J1 matin** | Q11 | Émargement AM |
| **J1** | Q12 | Animation module 2 |
| **J1** | Q16b | Évaluation des acquis (test final) |
| **J1** | Q16 | Questionnaire satisfaction à chaud |
| **J1 après-midi** | Q11 | Émargement PM |
| J+3 | Q17 | Établissement certificats de réalisation |
| J+3 | Q18 | Envoi attestations de fin de formation |
| J+5 | Q23 | Réception bilan formateur |
| J+7 | Q19 | Émission facture (à l'OPCO si subrogation) |
| J+7 | Q20 | Envoi justificatifs à l'OPCO |
| J+10 | Q24 | Archivage du dossier complet |
| **J+60** | Q21 | Envoi questionnaire satisfaction à froid |
| **J+90** | Q22 | Évaluation transfert (optionnel) |
| **J+90** | Q25 | Analyse des retours + plan d'amélioration |

---

*Document généré le 19 mars 2026 — Sources : Référentiel National Qualité (RNQ) v9, Guide de lecture Qualiopi (8 janvier 2024), Code du travail (art. L.6353, R.6313, R.6332), portail EDOF Mon Compte Formation, documentation OPCO (OPCO EP, OPCO Atlas, OPCO 2i).*
