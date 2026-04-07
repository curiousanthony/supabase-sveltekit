# Backlog

All work items for Mentore Manager, tagged by status and priority.

## Status Tags

- `[BACKLOG]` — not yet scheduled
- `[SPRINT]` — in current sprint
- `[IN PROGRESS]` — actively being worked on
- `[DONE]` — completed, not yet deployed
- `[SHIPPED]` — deployed to production
- `[CANCELLED]` — no longer needed

## Priority Levels

- **P0** — Critical, blocks other work
- **P1** — High priority, current sprint
- **P2** — Medium, next sprint
- **P3** — Low, someday/maybe

---

## Chunk 1 — Core PDF Templates + Convention Fix

Design decisions: `docs/decisions/2026-04-07-document-generation-system.md` §1–6, §13

| Status      | Item                                                                                          | Priority | Notes                                                                                                              |
| ----------- | --------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| `[SPRINT]`  | Implémenter `feuille_emargement` proof PDF (Mode 2 : post-séance, signatures numériques)      | P1       | Template pdfmake + case dans `document-generator.ts`. Données : séance + émargements signés.                       |
| `[SPRINT]`  | Implémenter `devis` PDF                                                                       | P1       | Template pdfmake. Données : formation, client, prix, workspace defaults (TVA, conditions). Voir décision §4.       |
| `[SPRINT]`  | Implémenter `ordre_mission` PDF                                                               | P1       | Template pdfmake. Données : formateur, formation, TJM, frais. Voir décision §5.                                   |
| `[SPRINT]`  | Corriger `nbParticipants` convention (requête `formation_apprenants`, pas `contacts.id`)       | P1       | Bug confirmé dans `document-generator.ts` convention case.                                                         |
| `[SPRINT]`  | Brancher pricing convention (prixConvenu / prixPublic → `pricing.prixTotal`)                   | P1       | Actuellement hardcodé `null`.                                                                                      |
| `[SPRINT]`  | Ajouter `prixConvenu` (numeric, nullable) à la table `formations`                             | P1       | Migration Drizzle + mise à jour schéma.                                                                            |
| `[SPRINT]`  | Ajouter defaults financiers workspace (`tvaRate`, `defaultPaymentTerms`, `defaultDevisValidityDays`) | P1 | Migration Drizzle sur `workspaces`. Voir décision §13.                                                             |
| `[SPRINT]`  | Mettre à jour `GENERATABLE_TYPES` / UI Documents tab si nécessaire                            | P1       | `feuille_emargement` manque dans le dropdown actuellement.                                                         |

## Chunk 2 — Document Lifecycle States + Documents Tab UX

Design decisions: `docs/decisions/2026-04-07-document-generation-system.md` §2, §8, §11

**Requires further brainstorming** avant implémentation (voir décision §11 + §15).

| Status      | Item                                                                                    | Priority | Notes                                                                                      |
| ----------- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `[BACKLOG]` | Statuts riches par type de document (généré → envoyé → signé/accepté/refusé/archivé)    | P1       | Transitions automatiques sauf devis accepté/refusé (manuel).                               |
| `[BACKLOG]` | Prompt contextuel de génération sur l'onglet Documents (banner quest-aware)              | P1       | Query param `?quest=xxx` → banner "Le devis est prêt à être généré".                      |
| `[BACKLOG]` | Regroupement par phase (Conception / Déploiement / Évaluation) dans l'onglet Documents  | P2       | Remplace la liste plate actuelle.                                                          |
| `[BACKLOG]` | Regroupement documents per-learner (convocation ×5 sous un groupe collapsible)           | P2       | Éviter l'overwhelm visuel.                                                                 |
| `[BACKLOG]` | Prompt de régénération ("Les données ont changé — Régénérer ?")                         | P2       | Compare `formation.updatedAt` vs `document.generatedAt`.                                   |
| `[BACKLOG]` | Error states avec fix paths ("Information manquante : X — [Compléter →]")               | P2       | Navigation vers le bon onglet avec champ pré-focusé.                                       |

## Chunk 3 — Auto-Generation Triggers

Design decisions: `docs/decisions/2026-04-07-document-generation-system.md` §3, §7

**Requires further brainstorming** : infrastructure cron, UX notifications.

| Status      | Item                                                                                    | Priority | Notes                                                                          |
| ----------- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------ |
| `[BACKLOG]` | Auto-génération feuille d'émargement blank (Mode 1) J-1 pour présentiel/hybride         | P2       | Cron job ou pg_cron. Template vierge avec zones signature.                     |
| `[BACKLOG]` | Auto-génération feuille d'émargement proof (Mode 2) après toutes signatures collectées  | P2       | Trigger sur complétion émargements séance.                                     |
| `[BACKLOG]` | Infrastructure de tâches planifiées (cron)                                               | P2       | SvelteKit scheduled functions, Supabase pg_cron, ou edge functions.            |

## Chunk 4 — Deal Devis + Formation Inheritance

Design decisions: `docs/decisions/2026-04-07-document-generation-system.md` §9

**Requires further brainstorming** : Deal documents UI, other deal-level documents.

| Status      | Item                                                                                    | Priority | Notes                                                                                      |
| ----------- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `[BACKLOG]` | Génération devis depuis la page Deal (stage Négociation+)                                | P2       | Nouveau UI dans `/deals/[id]`.                                                             |
| `[BACKLOG]` | `closeAndCreateFormation` hérite le devis + auto-complète quest `devis`                  | P2       | Lien `dealId` sur `formation_documents` ou mécanisme de liaison.                           |
| `[BACKLOG]` | Badge "Hérité du deal" dans l'onglet Documents                                           | P3       | Informatif.                                                                                |

## Chunk 5 — Attestation + Evaluation Tracking (Future)

Design decisions: `docs/decisions/2026-04-07-document-generation-system.md` §10

**Requires extensive brainstorming** avant toute implémentation.

| Status      | Item                                                                                    | Priority | Notes                                                                                      |
| ----------- | --------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| `[BACKLOG]` | Schéma résultats d'évaluation per-learner, per-module                                    | P2       | Prérequis pour attestation PDF.                                                            |
| `[BACKLOG]` | Implémenter `attestation` PDF avec résultats individuels                                 | P2       | Articles L.6353-1, R.6353-1.                                                               |
| `[BACKLOG]` | Intégration avec système de questionnaires (résultats structurés)                        | P3       | Actuellement URLs externes (Google Forms).                                                 |

---

## Formations — e-mail (Postmark)

| Status      | Item                                                                                       | Priority | Notes                                                                          |
| ----------- | ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| `[SHIPPED]` | Envoi liens émargement (apprenant + formateur) via templates Postmark                      | —        | `seances/+page.server.ts`                                                      |
| `[SHIPPED]` | Envoi e-mails quête suivi via `sendQuestEmail` + `EMAIL_TYPE_TO_TEMPLATE`                  | —        | `suivi/+page.server.ts`                                                        |
| `[BACKLOG]` | Ajouter templates relance manquants (`devis_relance`, `convention_relance`, `ordre_mission_relance`) | P1 | Actuellement fallback sur `analyse-besoins` (mauvais template). Voir décision §12. |
| `[BACKLOG]` | Passer `ctaUrl` dans `sendQuestEmail` selon le type d'email                                | P1       | Templates Postmark attendent `{{#ctaUrl}}`. Voir décision §12.                 |
| `[BACKLOG]` | Webhook Postmark (delivery, bounce, spam) → mise à jour `formation_emails.status`          | P2       | Pas d'endpoint webhook dans le dépôt à date.                                  |
| `[BACKLOG]` | Brancher ou retirer `sendFormationEmail` (HTML brut) — aucun appel route                   | P3       | `email-service.ts`                                                             |
| `[BACKLOG]` | Unifier envoi invitation workspace sur Postmark (optionnel)                                | P3       | Aujourd'hui token + copie lien.                                                |

## Autres

| Status      | Item                                                                                       | Priority | Notes                                                                          |
| ----------- | ------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------------------------------------ |
| `[BACKLOG]` | Apposition signatures sur PDF (`pdf-lib`)                                                  | P3       | Convention / ordre de mission signés retournés. Timing TBD.                    |
| `[BACKLOG]` | Vérifier / implémenter envoi auto `reglement_interieur` (spec suivi HUD)                   | P2       | `docs/specs/formations/2026-03-24-suivi-tab-hud-banner-design.md`              |

## Hors périmètre Postmark (information)

- E-mails **Supabase Auth** (reset, confirmation, etc.) restent gérés par Supabase, pas Postmark.

---

*Dernière mise à jour : 2026-04-07 — restructuré en chunks alignés sur `docs/decisions/2026-04-07-document-generation-system.md`.*
