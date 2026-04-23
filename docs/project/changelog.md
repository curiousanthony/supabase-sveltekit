# Changelog

## 2026-04-22

- T-56 Accessibilité (Qualiopi indicateur 26) — workspace-level defaults (`workspaces.default_referent_handicap` + `default_dispositions_handicap`) with optional per-formation override (`formations.referent_handicap` + `dispositions_handicap`). New "Accessibilité" Card in `/parametres/workspace` for the defaults. New collapsed "Accessibilité" sub-section inside the Fiche Logistique card showing the resolved effective values (`formation.x ?? workspace.defaultX`) with a one-line summary; expanding reveals an explicit Modifier button that opens a Switch-gated form for the rare subcontracted-formateur case (Hick's Law — most OFs have a single referent for the whole org). Yellow "indicateur 26 manquant" banner when nothing configured at either level. Convention PDF gets a new "Article — Accessibilité aux personnes en situation de handicap" between Moyens pédagogiques and Conditions financières; `document-generator.ts` pre-resolves the override→default fallback before passing to templates so per-template builders stay decoupled from inheritance rules. Schema fields are migration-only-ready for the future programme template (not yet implemented).

## 2026-04-21

- T-54 Fiche restructure — Financement Card removed entirely (TJM formateur, Type financement, Montant accordé, Financement accordé toggle all gone from the Fiche; column drop ships in T-51). New section order: **Identification → Référencement → Pédagogique → Logistique → Tarification**. Référencement is collapsed behind a single Switch ("Cette formation prépare-t-elle à une certification ?") that defaults to *off* unless any of the 6 référencement fields already has a value (Hick's Law — most formations aren't certifying); toggle is a writable derivation, never destroys field values. New Pédagogique Card surfaces a read-only `ObjectifsRollup` (count badge, first 3 module objectifs, "Modifier dans Programme →" CTA, empty state when no modules / no objectifs) plus 2 explicit Modifier/Enregistrer textareas (`prerequis`, `publicVise`) — never inline blur-save per UX review (Marie types long text, gets interrupted; ⌘+Entrée save / Échap cancel). New Tarification Card with `prixPublic` + `prixConvenu` inline-edit numeric inputs and a footnote pointing to the Finances tab for funding details. `+page.server.ts` `allowedFields` drops `typeFinancement`/`montantAccorde`/`financementAccorde`/`tjmFormateur`, adds `prerequis`/`publicVise`/`prixPublic`/`prixConvenu` (parseFloat with ≥0 guard); `recalculateActionDueDates` no longer triggers on `typeFinancement` (dead code path). Two reusable components extracted to `$lib/components/formations/fiche/`. Niveau de qualification picker uses RNCP labels 3–8 (CAP/BEP → Doctorat).
- T-53 UI Finances — legacy "Revenus" 3-tile Card removed; new "Synthèse financière" Card surfaces 4 responsive tiles (Total formation / Financé / Reste à charge à recouvrer with per-payer apprenant/entreprise/OF chips / Statut global Badge). "Sources de financement" Card lists every funding line (source short-label + payer chip + French status Badge; Demandé/Accordé/Décision/Paiement/Réf on line 2) with Add/Edit/Delete; empty state has an explicit CTA. Funding Dialog covers the 9 fields per acceptance with smart defaults that only fill blanks (CPF → Caisse des Dépôts / apprenant ; OPCO_* → entreprise but Marie picks the OPCO ; EmployeurDirect → entreprise + company name from formation). Invoice Dialog gains a conditional "Lier à une source de financement" Select (hidden when no sources exist); linked invoices show a compact Banknote chip in the list. New pure helper `src/lib/utils/funding-source-labels.ts` maps the 19 source codes to French labels + smart defaults and is reusable by T-57's header chip. Mobile 2×2 synthesis grid (`grid-cols-2 sm:grid-cols-4`); funding rows collapse to two lines on ≤640px.
- T-52 Backend — Finances loader now returns `fundingSources` + a derived `summary` (`totalRequested`, `totalGranted`, `resteACharge.byPayer` split across apprenant/entreprise/OF, `percentCovered`, `statutGlobal`); pure `getFundingSummary` service (8 unit tests, 0 DB) is reusable by T-57's header chip. Three new actions (`createFundingSource`/`updateFundingSource`/`deleteFundingSource`) plus `fundingSourceId` on invoice create/update, all workspace-checked and audit-logged. Adds `payer_type` enum + NOT-NULL column (default `apprenant`, idempotent backfill OPCO_*/EmployeurDirect/FNE/AGEFICE/FIFPL/FAFCEA → entreprise). Unblocks T-53 (Finances UI).
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