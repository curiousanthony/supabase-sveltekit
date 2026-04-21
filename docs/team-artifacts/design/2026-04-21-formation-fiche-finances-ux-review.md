# Formation Fiche + Finances — UX Review

**Date:** 2026-04-21
**Author:** ux-designer subagent
**Persona:** **Marie**, 34, administrative manager at a French OF (Qualiopi-certified). Manages 10–20 formations in parallel, often interrupted by phone, latent audit anxiety. Not tech-savvy; uses the app because she must.
**Source analysis:** [`docs/team-artifacts/analysis/2026-04-21-formation-fiche-audit.md`](../analysis/2026-04-21-formation-fiche-audit.md)
**Files reviewed:** `src/routes/(app)/formations/[id]/fiche/+page.svelte`, `src/routes/(app)/formations/[id]/finances/+page.svelte`, `src/lib/db/schema/formations.ts`, `src/lib/preflight/document-preflight.ts`

---

## TL;DR

1. **The Fiche is half-blind.** Three Qualiopi-mandatory pédagogique fields (`objectifs`, `prerequis`, `publicVise`) and the legally-required `prixConvenu` already exist in the DB but are **invisible** in the UI. Marie cannot fill them — silent compliance gap on every formation.
2. **Référencement (RNCP/RS/CPF) is cryptic.** Only `codeRncp` is shown, with one line of help. RS and CPF fiche numbers are absent. Marie doesn't know what these codes are or whether her formation needs them. **Solution: progressive disclosure** behind a "Cette formation est-elle certifiante ?" toggle, with French popovers that teach as they ask.
3. **Financement leaves the Fiche entirely.** Single-row financing model is structurally wrong: cannot express CPF + employer abondement, partial grants, status lifecycle, or per-source dossier refs. Move all financing UI to Finances tab; Fiche keeps a read-only chip with deep-link.
4. **Finances becomes a real funding cockpit.** Multi-line "Sources de financement" card (Combobox typed sources, status badges per line) + synthesis card (Total | Financé | Reste à charge | Statut global). Loss-aversion on un-funded balance, never alarmist.
5. **Editing pattern stays inline-cell.** Switching to "Modifier" toggles would force Marie to commit modal blocks of 8 fields = peak cognitive load + Peak-End regression. Inline editing wins for interruption resilience.

**Headline call:** Schema-first, UI-second. Ship the multi-source funding model and the missing pédagogique fields *before* polishing layout — the data shape is the bottleneck.

---

## Persona Recap & Hypotheses

| Hypothesis | Evidence to gather post-ship |
|---|---|
| H1: Marie never enters `objectifs` today because the field isn't visible — but documents fail at generation. | Audit log: count formations with non-null `objectifs` vs. total formations created in last 90 days. |
| H2: Marie types arbitrary text into Code RNCP because she doesn't know what "RNCP" stands for. | Pattern-match `codeRncp` values against `^RNCP\d{4,5}$`; expect <40% match. |
| H3: Marie does not know that `prixConvenu` is legally required for a convention. | Sample 10 conventions generated last month, count missing financial terms section. |
| H4: When financing is multi-source (CPF + employer), Marie tracks it in a separate spreadsheet. | Open-ended interview question: "Comment suivez-vous le financement quand il y a plusieurs payeurs ?" |
| H5: After the redesign, Marie will want to land on Finances first when opening a formation in the morning (status check). | After ship: track tab-first-visit per session for power users. |

---

## Click-Path Analysis

### Goal A — "Renseigner les objectifs pédagogiques" (Qualiopi ind. 5)

| State | Clicks | Friction |
|---|---|---|
| **Today** | ∞ (impossible from UI) | 🔴 Critical / Cognitive — Marie cannot complete this task without backend access. |
| **Target** | 2 (open Fiche → click "Objectifs" textarea) | None |

### Goal B — "Vérifier le statut de financement avant un appel client"

| State | Clicks | Friction |
|---|---|---|
| **Today** | Open Fiche → scroll to bottom card → read `montantAccorde` + Switch (binary) → mental math vs. price (which is missing on Fiche) | 🟠 Major / Cognitive + Visual — boolean status, no price comparison, scattered |
| **Target** | 1 (chip visible above the fold on any sub-route header) | None — status visible at a glance |

### Goal C — "Ajouter une 2e source de financement (CPF + employeur)"

| State | Clicks | Friction |
|---|---|---|
| **Today** | Impossible — single-row model overwrites the first source | 🔴 Critical / Data — model error |
| **Target** | 3 (Finances → "+ Ajouter une source" → fill dialog → Enregistrer) | None |

### Goal D — "Comprendre ce qu'est un Code RS"

| State | Clicks | Friction |
|---|---|---|
| **Today** | Field absent. Even if present, no in-product explanation. Marie googles it and lands on 5 conflicting blog posts. | 🟠 Major / Emotional — feels stupid, abandons |
| **Target** | Hover/click info icon → 2-line French explanation + link to France Compétences | None |

---

## Findings

> Severity legend: 🔴 Critical (blocks task / data loss / legal gap) · 🟠 Major (significant friction) · 🟡 Minor (recoverable) · 🔵 Polish

### F1 🔴 — Pédagogique fields invisible (`prerequis`, `publicVise`) + duplicated `objectifs`

- **Location:** Fiche, would belong to a new "Pédagogique" card.
- **Persona impact:** Every Marie, every formation.
- **Observed:**
  - `prerequis` and `publicVise` exist on `formations` table but no UI control renders them — Marie has no path.
  - `objectifs` exists at BOTH formation level (`formations.objectifs`) AND module level (`modules.objectifs`). Module-level is already editable on Programme tab. Formation-level is invisible.
  - `modaliteEvaluation` exists ONLY at module level (`modules.modaliteEvaluation`); the `formations` table has no such column.
- **Expected:** Pédagogique card with:
  - Editable textareas for `prerequis` and `publicVise` (only place to fill them).
  - Read-only roll-up of module-level `objectifs` with deep-link to Programme — avoids data duplication and respects single-source-of-truth.
  - No `modaliteEvaluation` field on Fiche (lives per-module on Programme).
- **Mechanism:** Recognition over recall + Affordance failure (Norman) for the missing fields. For `objectifs`, the duplicate-data anti-pattern would force Marie to keep two copies in sync — cognitive tax + drift risk.
- **Emotional impact:** **5/5** during audit (Marie discovers her own programme is incomplete on inspection day) for `prerequis`/`publicVise`; would be **3/5** annoyance if we'd asked her to fill `objectifs` twice.
- **Recommendation:** Add Pédagogique card on Fiche with the two editable fields + roll-up; preflight checks module-level `objectifs` aggregation for convention/programme warnings.

### F2 🔴 — `prixConvenu` invisible — legal gap

- **Location:** Fiche, would belong to a "Tarification" card.
- **Persona impact:** B2B formations (the majority).
- **Observed:** No UI input. Convention can be generated without it.
- **Expected:** Numeric input on Fiche; preflight `block` for convention generation.
- **Mechanism:** Default-effect: missing input ⇒ Marie believes nothing is required.
- **Emotional impact:** **5/5** if a labour inspector reads the convention.
- **Recommendation:** Add `prixPublic` + `prixConvenu` numeric inputs. Block convention generation when `prixConvenu` is null (Article L6353-1).

### F3 🔴 — Financing data model cannot express reality

- **Location:** Fiche "Financement" card + Finances "Revenus" card.
- **Persona impact:** Any formation with multi-source funding (CPF + abondement, OPCO + reste à charge…).
- **Observed:** `typeFinancement` is a single enum mixing format and financing axes (`Inter` and `Intra` are formats, not financing types). `montantAccorde` is a single scalar. `financementAccorde` is a boolean.
- **Expected:** Multi-line `formation_funding_sources` table with typed source enum, status lifecycle, dossier reference.
- **Mechanism:** Surface area of false confidence. The boolean Switch creates an illusion of completeness.
- **Emotional impact:** **4/5** when Marie discovers OPCO Atlas only granted half her request and she's already invoiced the client.
- **Recommendation:** Implement schema from analyst §4.2; deprecate `typeFinancement`/`montantAccorde`/`financementAccorde` after migration.

### F4 🟠 — Code RNCP shown for all formations without conditional logic

- **Location:** Fiche "Informations générales" card.
- **Persona impact:** Marie when running non-certifying formations (most cases) sees a cryptic field she might fill incorrectly out of fear.
- **Observed:** Field shown unconditionally; one-line help text below; no Code RS, no Code CPF.
- **Expected:** A toggle "Cette formation est-elle certifiante ?" that reveals a "Référencement" card with RNCP / RS / CPF / certificateur / niveau, each with an info popover.
- **Mechanism:** Hick's Law + Cognitive Load. Showing 3 codes by default = 3 decisions for every formation, when only ~30% of formations need any.
- **Emotional impact:** **3/5** (feels stupid).
- **Recommendation:** Progressive disclosure with explanatory toggle. See "Référencement section design" below.

### F5 🟠 — `tjmFormateur` mis-located in Financement card

- **Location:** Fiche, "Financement" card.
- **Persona impact:** Marie + auditors confused by formation-level TJM when 3 formateurs each have their own TJM in `formationFormateurs`.
- **Observed:** Field has no calculation purpose (Finances tab uses per-formateur TJM correctly).
- **Mechanism:** Data redundancy creating semantic doubt.
- **Emotional impact:** **2/5** (annoyance).
- **Recommendation:** Drop column. Migrate orphan values to `formationFormateurs` rows.

### F6 🟠 — Accessibility / `referentHandicap` absent (Qualiopi ind. 26)

- **Location:** Fiche, would belong to "Logistique".
- **Persona impact:** Every Marie at audit time. Ind. 26 is mandatory for **all** OFs.
- **Observed:** No field; referent handicap not surfaced anywhere in the app.
- **Expected:** Workspace-level setting (default referent + default provisions) **with per-formation override** (toggle "Cette formation a des dispositions spécifiques").
- **Mechanism:** Convention over configuration. Most OFs have one referent; outlier formations need override.
- **Emotional impact:** **5/5** at audit if missing from the convention.
- **Recommendation:** Workspace setting + Fiche logistique override section (collapsed by default; chip "Référent : Mme Lefèvre — provisions standard" in collapsed state).

### F7 🟡 — `formationType` enum value `'CPF'` conflates format with financing

- **Persona impact:** Marie selects "CPF" thinking it's a delivery format; downstream quest engine misinterprets.
- **Observed:** `TYPE_OPTIONS` = `['Intra', 'Inter', 'CPF']`.
- **Recommendation:** Replace with `['Intra', 'Inter', 'Sur-mesure']` + `cpfEligible: boolean`. Migrate after quest-engine audit (analyst Q3).

### F8 🟡 — Inline-cell editing has weak hover affordance

- **Location:** All Fiche text fields.
- **Observed:** `border-transparent` on idle, `hover:border-input` on hover. Marie may not realize fields are editable.
- **Recommendation:** Keep inline-cell pattern (correct UX choice for interruption-resilient work) but add a subtle pencil icon on hover and a 1px dotted underline on idle to telegraph editability. Reserve "Modifier" toggles for Pédagogique textareas where commit semantics matter (long-form content).

### F9 🟡 — No status chip on any tab header

- **Persona impact:** Marie loses status context when navigating between tabs.
- **Recommendation:** Add the financing chip to the page-level Formation header (above tabs) so it persists across all sub-routes. Read-only deep-link to Finances.

### F10 🔵 — `montantAccorde` formatter rounds to 0 fraction digits

- Cosmetic; aligns with `fmtCurrency` in Finances. Keep consistent.

---

## UX Metrics Table

| Metric | Today | After redesign | Δ |
|---|---|---|---|
| Fields above the fold (Fiche) | 4 (Intitulé, Type, Modalité, Durée) | 4 (Intitulé, Type, Modalité, Durée) | = |
| Cards on Fiche | 3 | 4 default + 1 conditional ("Référencement") | +1 |
| Click-cost: enter pédagogique fields | ∞ (impossible) | 2 | ✅ |
| Click-cost: read financing status from any tab | 4 (navigate to Fiche → scroll → read 3 controls) | 0 (chip in header) | -4 |
| Click-cost: add second funding source | ∞ (impossible) | 3 | ✅ |
| Cognitive load: Fiche idle scan (chunks) | 18 fields × 3 sections, mixed concerns | 14–17 fields × 4–5 grouped concerns | ↓ |
| Documents blocked silently due to missing data | 4 types (programme, convention, certificat, devis-CPF) | 0 (preflight covers `prixConvenu`, `objectifs`, `publicVise`) | ✅ |

---

## Section-by-Section Design

### Section order (Fiche)

1. **Identification** (always visible)
   - `name` · `type` (Intra/Inter/Sur-mesure) · `modalite` · `duree` · `dateDebut` · `dateFin`
   - `description` (full width)
   - `topicId` / `subtopicsIds`
2. **Référencement** (collapsed by default; toggle: "Cette formation prépare-t-elle à une certification ?")
   - When toggled on: `codeRncp` · `codeRs` · `codeCpfFiche` · `niveauQualification` · `certificateur` · `dateEnregistrementRncp`
   - Each code has a `Popover` info icon (see micro-copy below).
3. **Pédagogique** (always visible)
   - **Read-only roll-up** of module-level `objectifs` (count badge + first 3 + "Modifier dans Programme →")
   - Editable textareas: `prerequis` · `publicVise`
   - (No `objectifs` editor — that lives per-module on Programme. No `modalitesEvaluation` — field doesn't exist on `formations`.)
4. **Logistique & accessibilité**
   - `location` · `effectifMax` · `effectifMin`
   - **Accessibilité collapsed sub-card**: chip showing workspace default referent. Toggle "Dispositions spécifiques pour cette formation" reveals override fields (`referentHandicap`, `dispositionsHandicap`).
5. **Client / commercial**
   - `companyId` (with link) · `prixPublic` · `prixConvenu`
   - **Read-only financing chip** at the top of this card with deep-link to Finances.

### Référencement section — Why collapsed by default

- **Hick's Law:** Only ~30% of an OF's catalogue is certifying. Showing 5 esoteric fields by default for the other 70% adds 5 decisions × every formation Marie touches.
- **Educational through use:** The toggle question itself ("Cette formation prépare-t-elle à une certification ?") teaches Marie the conceptual frame before showing the codes. She learns by being asked.
- **Discoverability:** The toggle must use neutral framing — not "Avancé" (signals "not for me") but "Cette formation est-elle certifiante ?" (signals "this is the question I should answer").

### Référencement micro-copy (French popovers)

Each info icon opens a `Popover.Content` of ~3 lines max:

**Code RNCP** (info icon next to label)
> **Répertoire National des Certifications Professionnelles**
>
> Numéro à 4–5 chiffres attribué par France Compétences aux titres, diplômes et CQP. À renseigner uniquement si votre formation prépare à une certification RNCP.
>
> [Vérifier sur France Compétences →](https://www.francecompetences.fr/recherche-de-certifications/)

**Code RS**
> **Répertoire Spécifique**
>
> Identifiant des certifications de compétences (TOSA, PIX, SST, PCIE…) qui ne sont pas des titres mais des attestations d'une compétence précise. Format : RS + 4 chiffres.
>
> [Voir le Répertoire Spécifique →](https://www.francecompetences.fr/recherche-de-certifications/)

**Code fiche CPF**
> **Identifiant Mon Compte Formation**
>
> Numéro à 10 chiffres de votre fiche sur moncompteformation.gouv.fr. Ne s'applique qu'aux formations éligibles au CPF (donc reliées à un code RNCP ou RS).
>
> [Ouvrir Mon Compte Formation →](https://www.moncompteformation.gouv.fr/)

**Tone discipline:** No "Attention", no "Important", no "Obligatoire" in the popover body. The popover **explains**, the form **requests**. Compliance pressure lives in preflight banners, not in field-level help.

### Inline-cell vs. grouped form — Decision

**Keep inline-cell editing** for short fields and selects. **Use "Modifier"-style commit on Pédagogique textareas only** (prerequis / publicVise) because:

- Marie writes pédagogique content in 5–15 minute focused sessions; she wants explicit Save semantics to feel safe.
- Short fields benefit from interruption resilience (phone rings, blur saves automatically).
- Peak-End rule: the *end* of a Pédagogique editing session should be a deliberate "Enregistrer" click producing a "✓ Enregistré" toast — that's the moment of relief.

### Accessibility (`referentHandicap`) UI pattern

- **Workspace settings page** (Paramètres → Organisme): `defaultReferentHandicap` (text), `defaultDispositionsHandicap` (textarea).
- **Fiche / Logistique / sub-card "Accessibilité (Qualiopi ind. 26)"**:
  - Idle state (collapsed): chip with checkmark icon — "Référent : *{workspace default}* — dispositions standard". Click expands.
  - Expanded: read-only display of workspace defaults + `Switch` "Cette formation a des dispositions spécifiques" → reveals `referentHandicap` (text input, optional) and `dispositionsHandicap` (textarea, optional). Empty = use workspace default.
- **Migration:** existing formations show workspace default by default; per-formation values opt-in.

---

## Finances tab redesign

### New layout (top → bottom)

1. **Synthesis card** (replaces current "Revenus" card)
   - 4 KPI tiles in a row:
     - **Total formation** = `prixConvenu` (or fallback `prixPublic` with grey "estimation")
     - **Financé** = sum of `grantedAmount` where status ∈ {Accordé, Versé}
     - **Reste à charge** = `prixConvenu - financé`. Render with **muted color when 0**, **amber border when > 0 and < 30%**, **destructive border only if > 50%**. Below the number: small label "Apprenant : N € · Entreprise : N €" if responsibleParty tracked (analyst Q1).
     - **Statut global** badge: `Entièrement financé` (green) · `Partiellement financé` (amber) · `En attente` (blue) · `Sans financement` (grey)
   - **Loss-aversion framing on un-funded balance**: never red unless > 50% (don't punish low margins). Phrasing: "Reste à charge à recouvrer" rather than "Manque à gagner".
2. **Sources de financement card** (NEW — replaces single-row revenue display)
   - Header: title + count badge + `[+ Ajouter une source de financement]` button
   - List of funding lines. Each row:
     - Source label (e.g. "OPCO Atlas — Plan de Développement des Compétences") with small icon by source family
     - Payer (text)
     - Demandé · Accordé · Statut badge
     - Decision date + dossier ref (small, muted)
     - Action icons: `Pencil` (edit) · `Trash2` (delete with confirm)
   - Empty state: "Aucune source de financement enregistrée. Ajoutez les financeurs pour suivre votre dossier." + primary CTA.
3. **Coûts card** (unchanged structure — keep formateurs/salle/matériel/déplacement)
4. **Factures card** (extend invoice dialog with optional `fundingSourceId` Combobox: "Lier à une source de financement")

### "Add funding source" dialog (Dialog component)

Fields (in order — decision-making order):
1. **Type de source** (Combobox typed, searchable, list = analyst §1.2 canonical sources)
2. **Payeur** (text, autocomplete from past values per workspace; placeholder = "Ex : OPCO Atlas, Caisse des Dépôts, M. Dupont")
3. **Statut** (Select: Pressenti → Demandé → Accordé → Versé → Refusé → Annulé) — default `Pressenti`
4. **Montant demandé** (numeric €)
5. **Montant accordé** (numeric €, only enabled when status ≥ Accordé)
6. **Date de décision** (date picker; required when status ∈ {Accordé, Refusé, Versé})
7. **Date de versement prévue** (date picker; optional)
8. **Référence dossier** (text; placeholder "N° OPCO, ID commande CPF…")
9. **Notes** (textarea; visible to internal staff only)

**Defaults & smart behavior:**
- When source = `CPF`, payer auto-fills "Caisse des Dépôts" (read-only, edit-on-click).
- When source = `EmployeurDirect`, payer auto-fills `formation.company.name`.
- When `Statut` advances from `Demandé` to `Accordé`, focus jumps to "Date de décision".

### Migration moment — one-time banner

When a workspace user opens Finances after the redesign ships, render a dismissible `Card` banner once per user:

> **Le financement a déménagé ici** — Vous trouvez désormais le suivi multi-payeurs, les statuts par source et les dossiers dans cet onglet. La Fiche reste votre référence pour l'identité de la formation.
> [J'ai compris]

Persist dismissal in `localStorage` (`finances-redesign-banner-v1-dismissed`) **and** as a per-user audit log entry so we can measure adoption.

### Cross-tab: read-only financing chip

Place in the **Formation header** (above tab strip), so it persists across Fiche / Finances / Suivi / Documents:

```
[ Formation: ABCD123 ]   ◯ Statut: En cours    💶 OPCO Atlas — Partiellement financé · 600 € reste à charge   [Voir →]
```

Color rules:
- 🟢 Green: fully funded (`Entièrement financé`)
- 🟡 Amber: in flight (`En attente`, `Partiellement financé`)
- ⚪ Grey: no funding configured

The chip is a `<a>` linking to `/formations/{id}/finances`. Hover state: `Voir le détail →`.

---

## Prioritized Recommendations

1. **(Schema)** Build `formation_funding_sources` table, migrate existing single-row data, add `fundingSourceId` FK on `formationInvoices`. Drop `tjmFormateur`. — *blocks everything*
2. **(Backend)** Finances loader returns funding lines + computed totals; CRUD actions + audit log.
3. **(UI)** Finances tab redesign — synthesis card + multi-source list + add/edit dialog.
4. **(UI)** Fiche redesign — remove Financement card, add Pédagogique + Tarification + collapsed Référencement + accessibility sub-card.
5. **(Cross)** Read-only financing chip in formation header (replaces Fiche bottom card).
6. **(Help)** Popover micro-copy for RNCP / RS / CPF.
7. **(Preflight)** Add `prixConvenu` block, `objectifs`/`publicVise` warn for convention/programme.
8. **(Onboarding)** One-time migration banner on Finances.
9. **(Tech-debt)** Split `formationType` enum: `Intra` | `Inter` | `Sur-mesure` + `cpfEligible: boolean`. Audit quest-engine first (analyst Q3).

---

## Future considerations / Gaps

- **Workspace default referent handicap** screen (Settings → Organisme) — should ship same release as F6.
- **Per-formation responsible party** for reste à charge (analyst Q1) — needed before any apprenant-level invoicing.
- **OPCO structured list** (analyst Q5) — defer to V2; start with free-text payer + autocomplete from past values.
- **Multi-formateur funding split** (analyst Q2) — out of scope for V1; funding stays at formation level.
- **Mobile**: synthesis tiles must stack 2×2 on `<sm`. Funding row collapses to two-line layout. Min touch target 44px on action icons (Pencil/Trash2 size-9 instead of size-8).
- **Empty states**: every new card needs an explicit empty state with a primary CTA (no orphan blank zones).
- **Loading states**: when funding mutations land, optimistic update with rollback toast — Marie should never wait > 200ms for visual feedback.
- **Keyboard nav**: dialog must trap focus; `Esc` cancels; `Cmd+Enter` submits.

---

## Proposed tickets (refined from analyst §6)

The orchestrator may use this YAML verbatim after human approval. Each ticket is sized for one PR (small ≤ 2h, medium ≤ 1d, large ≤ 3d).

```yaml
tickets:
  - proposed_id: T-FN-1
    title: "Schema: formation_funding_sources table + funding enums + invoice FK"
    type: tech-debt
    priority: P1
    estimate: medium
    blocked_by: []
    acceptance:
      - New `formation_funding_sources` table created per analyst §4.2 (id, formationId, source, payerLabel, requestedAmount, grantedAmount, status, decisionDate, expectedPaymentDate, dossierReference, notes, timestamps)
      - `funding_source_type` and `funding_source_status` enums created in `schema/enums.ts`
      - `formation_invoices.funding_source_id` nullable FK added (ON DELETE SET NULL)
      - Drizzle relations updated; types exported from `$lib/db/schema`
      - Data migration: for each formation with `typeFinancement IS NOT NULL`, insert one funding source row mapping old enum → new enum (CPF→CPF, OPCO→OPCO_PDC, Intra/Inter→EmployeurDirect with comment)
      - Old columns `formations.type_financement`, `montant_accorde`, `financement_accorde` retained for one release cycle, marked deprecated in code comments
      - Migration is idempotent and reversible (down migration provided)

  - proposed_id: T-FN-2
    title: "Schema: drop formations.tjm_formateur with safe data migration"
    type: tech-debt
    priority: P2
    estimate: small
    blocked_by: [T-FN-1]
    acceptance:
      - Pre-migration script: for any formation with non-null `tjm_formateur` and zero `formation_formateurs` rows, log a warning and SKIP migration (require manual intervention)
      - Pre-migration script: for any formation with non-null `tjm_formateur` AND existing `formation_formateurs` rows where any tjm IS NULL, backfill those rows with the formation-level value
      - Drop column `formations.tjm_formateur`
      - Remove from `allowedFields` in `fiche/+page.server.ts`
      - Remove tjmFormateur card from Fiche
      - Finances `formateursCost` computation unchanged (already uses `formationFormateurs.tjm`)

  - proposed_id: T-FN-3
    title: "Backend: Finances loader + funding source CRUD actions"
    type: feature
    priority: P1
    estimate: medium
    blocked_by: [T-FN-1]
    acceptance:
      - Finances `+page.server.ts` load returns `fundingSources` array + computed totals (totalRequested, totalGranted, resteACharge, percentCovered, statutGlobal)
      - Actions: `createFundingSource`, `updateFundingSource`, `deleteFundingSource` with workspace ownership checks
      - All mutations write to `formation_audit_log` with action types `funding_source_created/updated/deleted`
      - `createInvoice`/`updateInvoice` accept optional `fundingSourceId` form field, validated as UUID belonging to the same formation
      - Server-side derivation logic extracted to `$lib/services/funding-summary.ts` for reuse (header chip, finances card)

  - proposed_id: T-FN-4
    title: "UI: Finances tab — synthesis card + multi-source funding card + add/edit dialog"
    type: feature
    priority: P1
    estimate: large
    blocked_by: [T-FN-3]
    acceptance:
      - New synthesis card shows 4 tiles (Total formation / Financé / Reste à charge / Statut global) using shadcn `Card` + `Badge`
      - "Sources de financement" card lists all funding lines with source label, payer, montants, status badge, dossier ref, edit/delete icons
      - "+ Ajouter une source de financement" `Dialog` with all 9 fields per design spec; `Combobox` for source type with canonical list; smart defaults (CPF → CDC payer; EmployeurDirect → company)
      - Empty state with explicit CTA when no funding sources
      - Invoice dialog gains `Combobox` "Lier à une source de financement" (optional)
      - Old "Revenus" 3-tile card removed (replaced by synthesis)
      - Loss-aversion phrasing applied to reste à charge ("Reste à charge à recouvrer", not "Manque à gagner"); colors per spec
      - Mobile: synthesis tiles stack 2×2; funding rows collapse to two lines

  - proposed_id: T-FN-5
    title: "UI: Fiche — remove Financement card, add Pédagogique + Tarification + Référencement collapsed"
    type: feature
    priority: P1
    estimate: large
    blocked_by: [T-FN-2]
    acceptance:
      - Entire "Financement" card removed from Fiche
      - New "Pédagogique" card: read-only `ObjectifsRollup` (aggregates `modules[].objectifs`) + textareas for `prerequis` and `publicVise`. The two editable textareas use explicit "Modifier"/"Enregistrer" buttons (not inline blur-save) per UX rationale. NO formation-level `objectifs` editor (data lives on modules). NO `modalitesEvaluation` field (does not exist on `formations` table).
      - New "Tarification" card with `prixPublic` + `prixConvenu` numeric inputs (inline-edit pattern)
      - "Référencement" card hidden behind toggle "Cette formation prépare-t-elle à une certification ?"; when toggled, shows codeRncp + codeRs + codeCpfFiche + niveauQualification + certificateur, each with `Popover` info icon
      - Section order matches design: Identification → Référencement (conditional) → Pédagogique → Logistique & Accessibilité → Client/Commercial
      - `allowedFields` in `+page.server.ts` updated; old financing fields removed
      - Inline-cell idle hover affordance polished: dotted underline + Pencil icon on hover

  - proposed_id: T-FN-6
    title: "Schema + UI: codeRs, codeCpfFiche, niveauQualification, certificateur fields"
    type: feature
    priority: P1
    estimate: small
    blocked_by: [T-FN-1]
    acceptance:
      - Schema additions: `code_rs` text, `code_cpf_fiche` text, `niveau_qualification` integer (1-8 check), `certificateur` text, `date_enregistrement_rncp` date
      - All exposed via Fiche Référencement card (T-FN-5)
      - `allowedFields` extended; UUID/format validations for codes (regex hints in placeholders)

  - proposed_id: T-FN-7
    title: "UI: Workspace setting + Fiche override for accessibilité (Qualiopi ind. 26)"
    type: feature
    priority: P1
    estimate: medium
    blocked_by: []
    acceptance:
      - Workspace settings page (`/parametres/organisme`) gains `defaultReferentHandicap` (text) + `defaultDispositionsHandicap` (textarea)
      - Schema additions: `workspaces.default_referent_handicap`, `workspaces.default_dispositions_handicap`, `formations.referent_handicap`, `formations.dispositions_handicap`
      - Fiche "Logistique" gets collapsed "Accessibilité" sub-card showing workspace default chip; toggle "Dispositions spécifiques" reveals override fields
      - Convention/programme document templates updated to read formation override OR workspace default

  - proposed_id: T-FN-8
    title: "UI: Read-only financing chip in formation header (cross-tab)"
    type: feature
    priority: P2
    estimate: small
    blocked_by: [T-FN-3]
    acceptance:
      - Chip placed in formation header layout (above tab strip), visible on every sub-route
      - Uses `getFundingSummary(formationId)` from T-FN-3
      - Color rules: green (fully funded) / amber (partial / in flight) / grey (no funding)
      - Click navigates to `/formations/{id}/finances`
      - Accessible: `role="link"` + descriptive `aria-label`

  - proposed_id: T-FN-9
    title: "Help copy: French popovers for Code RNCP / RS / CPF"
    type: feature
    priority: P2
    estimate: small
    blocked_by: [T-FN-5]
    acceptance:
      - `Popover` info icon next to each code label on Fiche Référencement
      - Copy verbatim per UX review §"Référencement micro-copy"
      - External links open in new tab with `rel="noopener noreferrer"`
      - Popovers keyboard-accessible (`aria-describedby`)

  - proposed_id: T-FN-10
    title: "Preflight: block convention without prixConvenu, warn programme without module objectifs/publicVise"
    type: feature
    priority: P2
    estimate: small
    blocked_by: [T-FN-5]
    acceptance:
      - `evaluatePreflight` adds: `prixConvenu IS NULL` → `block` for convention (focusKey: `prixConvenu`)
      - `modules.every(m => !m.objectifs)` (no module has objectifs) → `warn` for convention + programme (focusKey: `programme-modules`, deep-link to `/programme`)
      - `publicVise IS NULL` → `warn` for programme (focusKey: `publicVise`)
      - `PreflightFormation` interface extended with `prixConvenu`, `publicVise`, and `modules: Array<{ objectifs: string | null }>`
      - All preflight loaders updated to include the new columns + module objectifs aggregation
      - Fiche fields (`prixConvenu`, `publicVise`) and Programme tab tagged with matching `data-preflight-target` attributes for deep-link focus

  - proposed_id: T-FN-11
    title: "Onboarding: one-time 'Le financement a déménagé' banner on Finances"
    type: feature
    priority: P3
    estimate: small
    blocked_by: [T-FN-4]
    acceptance:
      - Card banner renders on Finances tab when `localStorage.getItem('finances-redesign-banner-v1-dismissed')` is null
      - Dismiss button persists to localStorage AND writes one audit_log entry per workspace user
      - Banner copy verbatim per UX review §"Migration moment"

  - proposed_id: T-FN-12
    title: "Tech-debt: split formationType — Intra/Inter/Sur-mesure + cpfEligible boolean"
    type: tech-debt
    priority: P3
    estimate: medium
    blocked_by: [T-FN-1, T-FN-3]
    acceptance:
      - Quest engine audit performed: confirm whether quest logic that branches on `type='CPF'` should branch on `cpfEligible` or on `funding_source_type IN (CPF, CPF_Transition)` (analyst Q3)
      - `formation_type` enum updated: drop `'CPF'`, add `'Sur-mesure'`
      - New column `formations.cpf_eligible` boolean default false
      - Data migration: every formation with `type = 'CPF'` becomes `type = 'Inter'` + `cpf_eligible = true` (or alternative based on quest audit)
      - Quest engine refactored accordingly; tests pass
      - Fiche Type combobox shows new options
```
