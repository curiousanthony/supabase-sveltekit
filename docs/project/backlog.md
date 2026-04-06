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

## Formations — documents (PDF)

| Status | Item | Priority | Notes |
| ------ | ---- | -------- | ----- |
| `[BACKLOG]` | Implémenter génération `feuille_emargement` (pdfmake + données séance / participants) | P1 | Types déjà exposés UI + `generateDocument` ; stub dans `document-generator.ts` |
| `[BACKLOG]` | Implémenter génération `attestation` | P1 | Idem |
| `[BACKLOG]` | Implémenter génération `devis` | P2 | Idem |
| `[BACKLOG]` | Implémenter génération `ordre_mission` | P2 | Idem |
| `[BACKLOG]` | Corriger `nbParticipants` sur convention (requête apprenants formation, pas `contacts.id = formationId`) | P1 | Bug données PDF convention |
| `[BACKLOG]` | Apposition signatures sur PDF (`pdf-lib`) + flux décrits dans plan documents | P2 | `.cursor/plans/formation_documents_&_ux_dd1d82b4.plan.md` |
| `[BACKLOG]` | Déclencheurs auto-génération documents (quest / lifecycle) | P2 | Aligner avec plan documents + suivi |

## Formations — e-mail (Postmark)

| Status | Item | Priority | Notes |
| ------ | ---- | -------- | ----- |
| `[SHIPPED]` | Envoi liens émargement (apprenant + formateur) via templates Postmark | — | `seances/+page.server.ts` |
| `[SHIPPED]` | Envoi e-mails quête suivi via `sendQuestEmail` + `EMAIL_TYPE_TO_TEMPLATE` | — | `suivi/+page.server.ts` |
| `[BACKLOG]` | Webhook Postmark (delivery, bounce, spam) → mise à jour `formation_emails.status` | P2 | Pas d’endpoint webhook dans le dépôt à date |
| `[BACKLOG]` | Brancher ou retirer `sendFormationEmail` (HTML brut) — aujourd’hui aucun appel route | P3 | `email-service.ts` |
| `[BACKLOG]` | Unifier envoi invitation workspace sur Postmark (optionnel) | P3 | Aujourd’hui token + copie lien ; pas d’e-mail applicatif |

## Specs et alignement

| Status | Item | Priority | Notes |
| ------ | ---- | -------- | ----- |
| `[BACKLOG]` | Vérifier / implémenter envoi auto `reglement_interieur` (spec suivi HUD) | P2 | `docs/specs/formations/2026-03-24-suivi-tab-hud-banner-design.md` |
| `[BACKLOG]` | Mettre à jour spec ou code pour écarts suivi / quêtes / documents | P3 | Éviter dérive plans `.cursor/plans/` vs code |

## Hors périmètre Postmark (information)

- E-mails **Supabase Auth** (reset, confirmation, etc.) restent gérés par Supabase, pas Postmark.

---

*Dernière mise à jour des items : 2026-04-06 (synthèse `docs/team-artifacts/management/status-2026-04-06-formations-email-documents.md`).*
