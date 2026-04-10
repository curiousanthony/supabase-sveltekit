# Changelog

## 2026-04-10
- T-35 Devis accept/refuse actions from Documents tab and Suivi quest sub-action
- T-37 "Marquer comme envoyé" action for postal sends outside the app
- T-28 Removed sendFormationEmail dead code (raw HTML path superseded by Postmark templates)
- T-8 Workspace logos processed at upload (Sharp → PNG, max 512px), bucket PNG-only migration, safe replace order
- T-39 Formations Kanban: horizontal scroll columns (match deals pipeline layout)

## 2026-04-09
- T-10 Contextual generation prompts: quest-driven inline prompts in Documents tab with deep-link scroll from Suivi
- T-9 Document lifecycle service (per-type state machines, transition validation, annule/remplace, devis expiry)
- T-33 Action-oriented display states: 4 color-coded labels, hidden remplace docs, expandable lifecycle timeline
- T-32 Schema migration for document lifecycle (7 columns, default genere, 3 indexes, 2 FKs)
- T-1 PDF currency formatting (fr-FR EUR, pdfmake-safe spacing)
- T-2 Europe/Paris timezone for PDF dates/times
- T-3 Exhaustive switch for DocumentType in document-generator
- T-4 Typed pdfmake CJS require (PdfMakeModule)
- T-5 Certificat émargements filtered by formation at DB (join)

## 2026-04-10
- T-34 Document lifecycle transition service with type-safe statuses, transactional audit logging, and devis read-time expiry
- T-6 Workspace-scoped RLS for formation_documents (SELECT/INSERT/UPDATE/DELETE)
- T-7 Workspace-scoped storage policies for formation-documents bucket

## 2026-04-08
- T-S1 Convention fix: participant count + pricing
- T-S2 3 new PDF templates (feuille_emargement, devis, ordre_mission)
- T-S3 Email relance templates + ctaUrl
- T-S4 Documents tab UI: séance + formateur pickers
- T-S5 Schema migration: prixConvenu + workspace financial defaults
