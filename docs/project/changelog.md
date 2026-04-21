# Changelog

## 2026-04-21

- T-55 Schema — adds 5 référencement columns to `formations` (`code_rs`, `code_cpf_fiche`, `niveau_qualification` CHECK 1–8, `certificateur`, `date_enregistrement_rncp`); Fiche `+page.server.ts` `allowedFields` extended with server-side bounds enforcement on `niveauQualification`. UI lands with T-54 (Référencement collapsible card).
- T-63 Schema — `formation_funding_sources` table + `funding_source_type`/`funding_source_status` enums + nullable `formation_invoices.funding_source_id` FK; idempotent migration with RLS, `updated_at` trigger, and a non-destructive backfill from legacy `formations.{type_financement, montant_accorde, financement_accorde}` (legacy columns kept one release for rollback). Foundation for the Finances multi-source rebuild (unblocks T-51, T-52, T-55).
- T-20 Schema — formation_documents.formation_id is now nullable and a nullable deal_id was added (FK to deals, ON DELETE SET NULL) so deal-stage docs can pre-exist any formation; CHECK guarantees one is always set; RLS hardened to AND-not-OR across formation/deal branches with explicit WITH CHECK on UPDATE (security review caught a HIGH cross-workspace data poisoning vector during the OR-permissive draft — now closed)
- T-46 Security — formation_audit_log INSERT policy now binds user_id to auth.uid() (RLS hardening) and AuditEntry.userId is a brand type (`AuthenticatedUserId`) that can only be minted server-side from a verified session
- T-48 Bug fix — Suivi quests now seeded inside the closeAndCreateFormation transaction so deal→formation flow produces a populated Suivi tab (mirrors /formations/creer behavior)

## 2026-04-20

- T-14 Batch generation for per-learner documents — "Générer pour tous" with 3-slot pool, partial-failure surfacing, per-learner deep links, AlertDialog cancel, full audit trail
- T-13 Pre-flight validation before document generation — checklist with block/warn/prerequisite, deep links, resume banner, server enforcement, suivi parity

## 2026-04-13

- T-12 Regeneration prompts — per-document stale indicators with versioning (genere→replace, envoye+→remplace, signe→blocked)
- T-11 Phase grouping in Documents tab — urgency sort, phase chips, grouper-par-phase toggle, per-learner collapsing
- T-17 Scheduled job infrastructure via Vercel Cron with emargement J-1 auto-generation

## 2026-04-10

- T-36 Compliance date warnings (amber/red) on Documents tab and Suivi HUD
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