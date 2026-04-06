# Roadmap

High-level product direction for Mentore Manager.

## Current Focus

- **Formations (branche `feat/formations-v2`)** — Compléter le **moteur de documents** : PDF manquants (`feuille_emargement`, `attestation`, puis `devis`, `ordre_mission`) et correction du **comptage participants** sur la convention.
- **Qualiopi / parcours Marie** — Prioriser les pièces les plus visibles pour l’audit et le flux quotidien (émargement déjà renforcé côté séances).

## Upcoming

- **Postmark « phase 2 »** — Webhooks de livraison / bounce, affichage ou statuts plus fins sur `formation_emails` si la traçabilité devient un critère de mise en production.
- **Alignement spec suivi** — Comportement auto (ex. règlement intérieur) vs implémentation actuelle ; ajuster la spec ou le code.
- **Document pipeline avancé** — Apposition de signatures, génération déclenchée par le parcours (quêtes), comme décrit dans les plans formations/documents.

## Future

- **E-mail produit unifié** — Invitations workspace, autres parcours CRM, éventuellement bascule partielle depuis les canaux actuels (selon décision produit).
- **SDK Postmark** — Le plan historique mentionnait le package `postmark` ; l’implémentation actuelle utilise `fetch` vers l’API (acceptable tant que les besoins restent simples).

## Completed Milestones

- **Vague 2 — Séances + émargement (2026 Q2)** — Décisions enregistrées dans `docs/decisions/2026-04-02-wave2-seances-emargement-decisions.md` : découpe AM/PM, lien module–formateur, émargement formateur, envoi des liens par **Postmark** (individuel + masse), création de séances par lot, UX calendrier.
- **E-mails formation via Postmark** — Templates pour séances (liens signature) + suivi (quêtes) ; journalisation `formation_emails`.
- **Documents formation (partiel)** — Génération **convention**, **convocation**, **certificat** (PDF + stockage) ; onglet Documents et actions serveur pour tous les types déclarés.

---

*Dernière mise à jour : 2026-04-06.*
