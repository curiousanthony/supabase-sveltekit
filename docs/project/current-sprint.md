# Current Sprint

Active sprint items and progress.

**Sprint**: Formations v2 (working branch)  
**Start**: —  
**End**: —  

*À renseigner avec les dates réelles de l’équipe lorsque le sprint est figé.*

## Goals

1. **Documents** — Réduire l’écart entre types exposés dans l’UI et types réellement générés (cible minimale : `feuille_emargement` + `attestation`, puis `devis` / `ordre_mission` selon capacité).
2. **Qualité données** — Corriger le calcul des participants sur la **convention** pour des PDFs fiables.
3. **Stabilisation** — Garder les envois formation sur Postmark templates ; noter explicitement ce qui reste hors Postmark (Auth, invites workspace).

## Items

| Status | Item | Priority | Notes |
| ------ | ---- | -------- | ----- |
| `[IN PROGRESS]` | Moteur PDF — types manquants formation | P1 | Voir `docs/project/backlog.md` section documents |
| `[BACKLOG]` | Fix `nbParticipants` convention | P1 | `document-generator.ts` |
| `[BACKLOG]` | Webhooks Postmark | P2 | Hors sprint minimal si pas bloquant release |

## Retrospective

*À compléter en fin de sprint.*

---

*Dernière mise à jour : 2026-04-06.*
