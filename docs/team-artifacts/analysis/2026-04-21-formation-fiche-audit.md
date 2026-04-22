# Formation Fiche Audit — 2026-04-21

**Authored by:** product-analyst subagent  
**Audience:** Founder + UX Designer (next phase)  
**Scope:** Fiche sub-route, Financement data model, tab placement recommendations  
**Codebase refs:** `src/routes/(app)/formations/[id]/fiche/`, `src/lib/db/schema/formations.ts`, `src/lib/db/schema/enums.ts`, `src/lib/preflight/document-preflight.ts`

---

## 1. Domain Refresher — Qualiopi + French OF Financing

### 1.1 Code RNCP vs Code RS vs Code CPF — What They Actually Are

**Code RNCP (Répertoire National des Certifications Professionnelles)**
- A 5-digit number prefixed `RNCP` (e.g. `RNCP35584`) assigned by France Compétences.
- Only applies to formations that lead to a **professional certification** (titre professionnel, diplôme, CQP, certification de branche) officially registered in the RNCP.
- **When it applies:** Certifying formations only. An OF does NOT have a code RNCP per-formation — the certification does. If the formation prepares learners for a registered certification, the OF references that certification's code.
- **Qualiopi relevance:** Ind. 3 (information on certifications targeted), Ind. 7 (adequacy with certification referential), Ind. 16 (preparation for examinations). These indicators are **not mandatory** for non-certifying OFs but become required the moment the OF claims to prepare for RNCP-registered titles.
- **Status in app:** Present as `codeRncp` text field — editable but no contextual guidance. No conditional logic: it appears for all formations regardless of whether the formation is certifying.

**Code RS (Répertoire Spécifique)**
- A 4-digit number prefixed `RS` (e.g. `RS5692`) assigned by France Compétences.
- Applies to **non-certifying skill certifications** (certifications de compétences) that do not meet the RNCP bar but are officially registered with France Compétences.
- Distinct from RNCP: RS certifications do NOT confer a professional title, only attest to a specific skill block.
- **When it applies:** When the OF delivers a formation that prepares for an RS-registered certification (e.g. TOSA, PIX, SST, PCIE). This is very common among OFs delivering digital, language, or safety skill formations.
- **Qualiopi relevance:** Ind. 3 requires communicating on both RNCP and RS certifications targeted. Without an RS code field, an OF running RS-registered formations cannot properly document this — compliance gap.
- **Status in app:** ABSENT. This is a **critical missing field** for OFs that run RS-certified formations (very common).

**Code CPF / Numéro de fiche Mon Compte Formation**
- Not a "code" per se, but the **identifiant de fiche** on Mon Compte Formation (the France Travail / CPF portal). Format: a 10-digit number.
- Only formations attached to RNCP or RS certifications are eligible for CPF financing. The CPF fiche ID is what learners search for on the portal.
- **When it applies:** When the formation is CPF-eligible (linked to RNCP or RS) AND the OF has registered a fiche on the MCF platform.
- **Qualiopi relevance:** Ind. 1 (publication of accessible information about the formation). The CPF fiche number is the learner-facing reference for public information.
- **Status in app:** ABSENT. Required for OFs that manage CPF formations.

**Summary table:**

| Code | Registry | Applies to | Qualiopi indicators |
|------|----------|-----------|---------------------|
| RNCP | France Compétences RNCP | Certifying formations (titre, diplôme, CQP) | Ind. 3, 7, 16 |
| RS | France Compétences RS | Non-certifying skill certifications (TOSA, SST, etc.) | Ind. 3 |
| MCF / CPF fiche ID | Mon Compte Formation | CPF-eligible formations (RNCP or RS) | Ind. 1 |

### 1.2 Canonical Funding Sources for a French OF Formation

This list is authoritative. Every real-world financing scenario maps to one of these sources. Marie should be able to identify any payer from this list.

| Source | Who pays | Common triggers | Notes |
|--------|----------|----------------|-------|
| **CPF — Compte Personnel de Formation** | Caisse des Dépôts (CDC) on behalf of the learner's CPF account | Learner initiates on MCF portal; formation must be RNCP/RS eligible | Funds come from CDC, not the learner directly |
| **CPF de Transition Professionnelle (PTP)** | Transitions Pro (CPIR regional) | Career change for employees; specific eligibility criteria | Often > 6 months duration; OPCO manages differently |
| **OPCO — Plan de Développement des Compétences (PDC)** | OPCO of the employer | Employer-initiated, skills development plan | Most common B2B source; OPCO name matters (Atlas, Akto, AFDAS, Constructys, etc.) |
| **OPCO — Alternance (Contrat d'apprentissage / Professionnalisation)** | OPCO on behalf of the employer | Alternance contracts | Governed by NPEC (niveaux de prise en charge) |
| **OPCO — Pro-A (Reconversion ou Promotion par Alternance)** | OPCO | Employee reconversion while employed | Requires branch-level agreement |
| **OPCO — AFEST (Action de Formation En Situation de Travail)** | OPCO | Workplace-based learning | Requires specific staging/documentation |
| **France Travail (ex Pôle Emploi) — AIF (Aide Individuelle à la Formation)** | France Travail | Unemployed job-seekers; formation not eligible for other funding | Requires prior agreement |
| **France Travail — POEI (Préparation Opérationnelle à l'Emploi Individuelle)** | France Travail + Employer | Pre-hire training, employer identified | Employer co-funds |
| **France Travail — POEC (Préparation Opérationnelle à l'Emploi Collective)** | France Travail + OPCO | Sector-wide, collective version of POEI | Sector/branch agreement needed |
| **Région / Conseil Régional** | Regional authority | Unemployed, low-skill, specific regional programs (PRF) | Varies heavily by region |
| **FSE / FSE+ (Fonds Social Européen)** | EU via national managing authority | Low-skill workers, social inclusion programs | Requires audit trail; co-financed with national/regional |
| **FNE-Formation** | French State / OPCO | Companies in difficulty, APLD, PSE situations | Typically 100% funded; eligibility criteria strict |
| **Auto-financement — Particulier** | The learner (personal funds) | Non-CPF formation, private consumer | B2C; rétractation rules apply (10 days) |
| **Employeur direct (non pris en charge)** | The employer directly | Intra formations the employer pays out of pocket, no OPCO involvement | No OPCO declaration required |
| **AGEFICE / FIFPL / FAFCEA** | FNE des travailleurs non-salariés (TNS) | Self-employed, artisans, liberal professions, micro-entrepreneurs | Sector-specific funds; often under-used |
| **Transitions Pro — CPF-TP (Congé de Formation)** | Transitions Pro | Full salary + training cost for career transitions | Not to be confused with standard PTP |
| **Co-financement multi-sources** | Multiple payers | CPF + employer abondement; OPCO + learner reste à charge | Requires per-source tracking |

### 1.3 Type de Formation vs Type de Financement — Two Independent Axes

The current `typesFinancement` enum — `['CPF', 'OPCO', 'Inter', 'Intra']` — conflates two completely different concepts. This is a structural data model error.

**Type de formation** (how the formation is organized and who attends):
- `Intra` — delivered within a single company, all learners from that company
- `Inter` — open session, learners from multiple companies/individuals
- `Sur-mesure` — custom, typically intra but with bespoke programme design

**Type de financement** (who pays and via which mechanism):
- See canonical list in §1.2

**Why they are independent:**
- An `Intra` formation can be financed via: OPCO-PDC, FNE-Formation, employeur direct, or auto-financement.
- An `Inter` formation can be financed via: CPF (per learner), OPCO, France Travail AIF, or auto-financement.
- A CPF-eligible formation can be delivered Intra, Inter, or Sur-mesure.

`Inter` and `Intra` in `typesFinancement` are business logic categories that belong in `formationType`, not in a financing enum. The current enum is fundamentally wrong and misleads Marie about what she is selecting.

### 1.4 Document Preflight — Field→Document Blocking Map

From `src/lib/preflight/document-preflight.ts`:

| Field | Blocks (severity) | Document types affected |
|-------|--------------------|------------------------|
| `clientId` / `companyId` (either) | Block | devis, convention, convocation, certificat |
| `typeFinancement = OPCO` + no workspace NDA | Warn → Block | devis (warn), certificat (block) |
| `dateDebut` (B2C + < 10 days) | Warn | devis |
| `seanceId` | Block | feuille_emargement |
| Learner email | Block | convocation |
| Signed convention (workflow step) | Prerequisite | convocation |
| Signed émargements | Block | certificat |

**Notable gaps in preflight** (fields that SHOULD block but don't):
- No `duree` check before programme generation
- No `objectifs` / `publicVise` check before convention generation (Qualiopi ind. 5, 6 require these in the convention)
- No `modalite` check
- No `codeRncp` / RS code validation for certifying formations before programme
- No `prixConvenu` / `prixPublic` check before convention (financial terms are mandatory in a convention de formation — Article L6353-1 Code du Travail)

---

## 2. Field-by-Field Audit of the Current Fiche

### Section: Informations générales

| Field | Rendered label | Decision | Rationale |
|-------|---------------|----------|-----------|
| `name` | Intitulé | **Stays on Fiche** | Formation identity; ind. 1, 6 require published name |
| `description` | Description | **Stays on Fiche** | Broad summary; distinct from `objectifs` |
| `type` | Type (Intra/Inter/CPF) | **Stays on Fiche — rename to "Format"** | Organizational axis, not a financing indicator; "CPF" here means "CPF-eligible format" which is ambiguous — should become a boolean `cpfEligible` or remain in format |
| `modalite` | Modalité | **Stays on Fiche** | Ind. 6 requires documenting delivery modality; ind. 1 requires it in public info |
| `duree` | Durée (heures) | **Stays on Fiche** | Ind. 1 requires duration in public programme; blocks document generation |
| `codeRncp` | Code RNCP | **Stays on Fiche — with contextual help + add RS/MCF siblings** | Ind. 3, 7 when certifying; currently shown without guidance |
| `topicId` | Thématique | **Stays on Fiche** | Domain classification; not Qualiopi but essential for BI/reporting |
| `subtopicsIds` | Sous-thématique | **Stays on Fiche** | Same rationale |

### Section: Logistique

| Field | Rendered label | Decision | Rationale |
|-------|---------------|----------|-----------|
| `dateDebut` | Date début | **Stays on Fiche** | Blocks multiple documents; required for convocation, emargement scheduling |
| `dateFin` | Date fin | **Stays on Fiche** | Required for certificat, BPF |
| `location` | Lieu de formation | **Stays on Fiche** | Ind. 6, ind. 9 (convocation must include location); required in convocation document |
| `clientId` / `companyId` | Client (entreprise) | **Stays on Fiche** | Blocks devis, convention, convocation, certificat |

### Section: Financement (currently on Fiche — should move)

| Field | Rendered label | Decision | Rationale |
|-------|---------------|----------|-----------|
| `typeFinancement` | Type financement | **Move to Finances tab — deprecate enum** | Not a formation identity field; belongs with cost/revenue data; current enum values are wrong |
| `montantAccorde` | Montant accordé | **Move to Finances tab — replace with funding lines model** | Single scalar cannot express multi-source funding or partial grants |
| `financementAccorde` | Financement accordé | **Move to Finances tab — replace with derived status** | Boolean is too coarse; the derived status (Entièrement financé / En attente / Partiellement financé) should replace it |
| `tjmFormateur` | TJM formateur | **Remove from Fiche — deprecate from schema** | Redundant: `formationFormateurs.tjm` already stores TJM per formateur; having a formation-level TJM creates inconsistency when multiple formateurs with different TJMs are assigned |

---

## 3. Missing Fields the Fiche Should Have

### 3.1 Identification / Référencement

| Field | In schema? | Persona / use-case | Documents unblocked |
|-------|-----------|-------------------|---------------------|
| `codeRs` — RS code | **No** | OFs delivering TOSA, SST, PCIE, PIX, etc. need to reference the RS entry; Qualiopi ind. 3 requires communicating certification targeted | programme, convention (mentions certification) |
| `codeCpfFiche` — MCF fiche ID | **No** | OFs managing CPF formations need the 10-digit MCF identifier for the learner-facing portal link and OPCO dossier references | devis (CPF), convention CPF |
| `niveauQualification` — EQF/RNCP level (1–8) | **No** | Required for RNCP/RS formations (e.g. Niveau 5 = Bac+2); displayed in programme and convention; ind. 3 | programme |
| `certificateur` — Certifying body name | **No** | When RNCP/RS: who delivers the certification exam (AFPA, CPNE, education nationale, etc.); ind. 7 | convention, certificat |
| `dateEnregistrementRncp` — RNCP registration date + expiry | **No** | Ind. 3: formations must target certifications still in force; auditors check validity | N/A (compliance evidence) |

### 3.2 Pédagogique

| Field | In schema? | Persona / use-case | Documents unblocked |
|-------|-----------|-------------------|---------------------|
| `objectifs` | **Yes** — in schema, NOT on Fiche | Core field for ind. 5; required in programme and convention (Article L6353-1); Marie enters this but has nowhere to put it unless she knows to look in the schema | programme, convention |
| `prerequis` | **Yes** — in schema, NOT on Fiche | Ind. 4 (needs analysis); published in programme; blocks generation if missing | programme, convocation (prerequis reminder) |
| `publicVise` | **Yes** (as `public_vise`) — NOT on Fiche | Ind. 1 requires published target audience; ind. 4 requires knowing who the formation is designed for | programme, convention |
| `modalitesEvaluation` | Enum exists (`modalite_evaluation`) but only at module level | Ind. 11 requires documented evaluation methods; formation-level evaluation method should be selectable independently | programme, certificat |
| `niveauEntree` — entry level required | **No** | Complements `prerequis` for certifying formations; ind. 4, ind. 8 (positionnement) | programme |

**Critical finding:** `objectifs`, `prerequis`, and `publicVise` exist in the schema but are NOT rendered on the Fiche. This means Marie has no way to fill them in the UI. These fields directly affect Qualiopi compliance for **every single formation** (ind. 1, 4, 5, 6) and block programme and convention generation in spirit even if not enforced by current preflight.

### 3.3 Logistique / Accessibilité

| Field | In schema? | Persona / use-case | Documents unblocked |
|-------|-----------|-------------------|---------------------|
| `referentHandicap` — name/contact | **No** | **Qualiopi ind. 26 (mandatory for all OF)** requires a named accessibility referent; auditors ask for this per-formation in practice | convention, programme (accessibility section) |
| `dispositionsHandicap` — accessibility provisions text | **No** | Ind. 26: what specific accommodations are available for this formation; different formations may have different provisions (e.g. présentiel in non-accessible premises) | programme |
| `effectifMax` — maximum headcount | **No** | Ind. 6 implicitly; practical for convention (number of learners stipulated) | convention |
| `effectifMin` — minimum headcount for session | **No** | Business logic: formation cancellation threshold; impacts scheduling | N/A (internal) |

### 3.4 Tarification / Commercial

| Field | In schema? | Persona / use-case | Documents unblocked |
|-------|-----------|-------------------|---------------------|
| `prixPublic` | **Yes** — in schema, NOT on Fiche | Ind. 1 requires published price; CPF fiche requires it; used in devis as starting price | devis |
| `prixConvenu` | **Yes** (precision 12,2) — NOT on Fiche | **Legally required in convention de formation** (Article L6353-1 Code du Travail: convention must include financial terms); critical missing from Fiche | convention (blocks financial terms section) |

**Critical finding:** `prixConvenu` is legally mandatory in the convention de formation. It is in the schema but not exposed in the UI. The current preflight does not block convention generation if `prixConvenu` is null — this is a legal compliance gap.

---

## 4. Financement Model Redesign (CRITICAL)

### 4.1 Problems with the Current Model

The current single-row financing model (`typeFinancement`, `montantAccorde`, `financementAccorde` on the `formations` table) cannot express:
1. Multi-source funding (CPF + employer abondement is standard for CPF formations)
2. Partial grants vs. total coverage
3. Reste à charge per responsible party (learner vs. company vs. OF)
4. Dossier references per funding source (OPCO dossier number, CPF order ID)
5. Status lifecycle per source (requested → approved → disbursed)
6. Which invoice is associated with which funding source

### 4.2 Proposed Table: `formation_funding_sources`

```typescript
export const fundingSourceType = pgEnum('funding_source_type', [
  'CPF',                    // Compte Personnel de Formation (CDC)
  'CPF_Transition',         // CPF de Transition Professionnelle (Transitions Pro)
  'OPCO_PDC',               // OPCO Plan de Développement des Compétences
  'OPCO_Alternance',        // OPCO Alternance (apprentissage / professionnalisation)
  'OPCO_ProA',              // OPCO Pro-A
  'OPCO_AFEST',             // OPCO AFEST
  'FranceTravail_AIF',      // France Travail Aide Individuelle à la Formation
  'FranceTravail_POEI',     // France Travail POEI
  'FranceTravail_POEC',     // France Travail POEC
  'Region',                 // Conseil Régional / PRF
  'FSE',                    // Fonds Social Européen / FSE+
  'FNE_Formation',          // FNE-Formation (State / OPCO)
  'TransitionsPro_CTP',     // Transitions Pro Congé de Formation
  'AGEFICE',                // TNS Commerce / Artisanat
  'FIFPL',                  // TNS Professions libérales
  'FAFCEA',                 // TNS Artisans
  'EmployeurDirect',        // Employer pays directly, no OPCO
  'AutoFinancement',        // Learner pays personally
  'Autre'                   // Catch-all; requires notes field
]);

export const fundingSourceStatus = pgEnum('funding_source_status', [
  'Pressenti',   // Anticipated but not yet requested
  'Demandé',     // Request sent / dossier filed
  'Accordé',     // Officially approved (decision received)
  'Refusé',      // Rejected
  'Versé',       // Funds actually disbursed to OF
  'Annulé'       // Cancelled after request
]);

export const formationFundingSources = pgTable(
  'formation_funding_sources',
  {
    id: uuid().defaultRandom().primaryKey().notNull(),
    formationId: uuid('formation_id').notNull(),
    source: fundingSourceType().notNull(),
    payerLabel: text('payer_label'),       // e.g. "OPCO Atlas", "Caisse des Dépôts", "M. Dupont"
    requestedAmount: numeric('requested_amount', { precision: 12, scale: 2 }),
    grantedAmount: numeric('granted_amount', { precision: 12, scale: 2 }),
    status: fundingSourceStatus().default('Pressenti').notNull(),
    decisionDate: date('decision_date'),
    expectedPaymentDate: date('expected_payment_date'),
    dossierReference: text('dossier_reference'),  // OPCO dossier #, CPF order ID, etc.
    notes: text(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
  },
  (table) => [
    foreignKey({
      columns: [table.formationId],
      foreignColumns: [formations.id],
      name: 'formation_funding_sources_formation_id_fkey'
    }).onUpdate('cascade').onDelete('cascade'),
    index('formation_funding_sources_formation_id_idx').on(table.formationId)
  ]
);
```

### 4.3 Linking Invoices to Funding Sources

Add an optional `fundingSourceId` FK to `formationInvoices`:

```typescript
// Addition to formationInvoices table columns:
fundingSourceId: uuid('funding_source_id')  // nullable; references formation_funding_sources.id
```

This allows: invoice to OPCO Atlas → linked to the OPCO_PDC funding line for Atlas. Reconciliation becomes trivial.

### 4.4 Derived Fields the UI Must Surface

These are computed from funding lines, not stored:

| Derived value | Formula | UI placement |
|---------------|---------|--------------|
| **Total financé** | `SUM(grantedAmount WHERE status IN ('Accordé','Versé'))` | Finances tab summary card |
| **Total demandé** | `SUM(requestedAmount WHERE status = 'Demandé')` | Finances tab |
| **Reste à charge** | `prixConvenu - totalFinancé` | Finances tab, with split by responsible payer |
| **% pris en charge** | `totalFinancé / prixConvenu * 100` | Finances tab summary |
| **Statut global financement** | Rule: all lines `Versé` → "Entièrement financé"; any line `Demandé` → "En attente"; `prixConvenu - totalFinancé > 0` → "Partiellement financé"; no lines → "Sans financement" | Fiche read-only chip |

### 4.5 Migration and Deprecation Strategy

- Add `formation_funding_sources` table.
- **Migration script:** for each `formation` where `typeFinancement IS NOT NULL`, create one `formation_funding_sources` row with `source` mapped from old enum, `grantedAmount = montantAccorde`, `status = financementAccorde ? 'Accordé' : 'Demandé'`.
- After data migration, mark `formations.typeFinancement`, `formations.montantAccorde`, `formations.financementAccorde` as deprecated (keep columns for 1 release cycle, then drop).
- Replace `typesFinancement` enum entirely with `funding_source_type` enum.
- **Also drop:** `formations.tjmFormateur` — see §5.

---

## 5. Tab Placement Recommendations

### 5.1 Should Financement Move to Finances Tab? **YES — entirely.**

The Fiche is the formation's identity and pedagogical specification. Financing is operational/financial data. Mixing them creates the "Project Manager Mindset" anti-pattern from the UX foundation (section 6.2): it forces Marie to context-switch between identity and financial operations within a single screen.

The Finances tab already manages `formationCostItems` and `formationInvoices`. Funding sources belong there as a third section: "Sources de financement" sits naturally between the cost breakdown and the invoices list.

### 5.2 Should Fiche Keep a Read-Only Financing Chip? **YES.**

The Fiche should display a single-line chip that is entirely read-only and deep-links to Finances. Example:

> `OPCO Atlas — Entièrement financé (4 500 €)` → `[Voir le financement →]`

This satisfies the "status-first" principle (Marie needs to know the financing status at a glance on the Fiche) without cluttering the Fiche with financial edit controls. The chip should be:
- Green: Entièrement financé
- Amber: En attente / Partiellement financé
- Grey: Sans financement (not configured)

### 5.3 Should `tjmFormateur` (Formation-Level) Be Deleted? **YES.**

`formations.tjmFormateur` is vestigial. The `formationFormateurs` junction table already stores `tjm` per formateur per formation. The Finances tab already correctly computes `formateursCost` from `formationFormateurs.tjm * numberOfDays` (line 40–47 of `finances/+page.svelte`).

`formations.tjmFormateur` is:
1. Redundant with per-formateur TJM already in the schema
2. Semantically undefined (which formateur does it refer to when multiple are assigned?)
3. Not used in any cost calculation in the Finances tab code
4. Currently exposed on the Fiche in the "Financement" card — which is confusing because TJM is a cost item, not a financing source

**Migration concern:** Before dropping the column, check if any legacy formation records have `tjmFormateur` set but no corresponding `formationFormateurs` rows. If so, the migration needs to create a `formationFormateurs` row with `tjm = formations.tjmFormateur` before the column drop. The migration script must handle this.

---

## 6. Suggested Ticket Breakdown

```yaml
tickets:
  - proposed_id: P1
    title: "Migration: formation_funding_sources table + enum overhaul"
    type: tech-debt
    priority: P1
    estimate: medium
    blocked_by: []
    acceptance:
      - New table `formation_funding_sources` created with all columns in §4.2
      - `funding_source_type` and `funding_source_status` enums created
      - Data migration script migrates existing `typeFinancement`/`montantAccorde`/`financementAccorde` rows to funding lines
      - `fundingSourceId` FK added to `formationInvoices` (nullable)
      - Old columns on `formations` marked deprecated (not yet dropped)

  - proposed_id: P2
    title: "Tech-debt: drop formations.tjmFormateur + data migration"
    type: tech-debt
    priority: P2
    estimate: small
    blocked_by: [P1]
    acceptance:
      - Migration script checks for orphan tjmFormateur values and creates formationFormateurs rows if needed
      - `formations.tjm_formateur` column dropped from schema and DB
      - `tjmFormateur` removed from Fiche allowedFields in +page.server.ts
      - Finances tab confirmed to still calculate formateursCost correctly from formationFormateurs

  - proposed_id: P3
    title: "Backend: Finances loaders + actions for multi-source funding"
    type: feature
    priority: P1
    estimate: medium
    blocked_by: [P1]
    acceptance:
      - Load action returns `fundingSources` array for the formation
      - CRUD actions: createFundingSource, updateFundingSource, deleteFundingSource
      - Derived values (totalFinancé, resteACharge, % couverture, statutGlobal) computed server-side and returned
      - Audit log events for all funding source mutations
      - Invoice creation form allows optional fundingSourceId selection

  - proposed_id: P4
    title: "UI: Redesign Finances tab — multi-line funding sources card"
    type: feature
    priority: P1
    estimate: large
    blocked_by: [P3]
    acceptance:
      - New "Sources de financement" section renders all funding lines as a table/list
      - Each line shows: source (human-readable label), payer, montant demandé, montant accordé, statut, dossier ref
      - Summary card shows: Total financé / Total demandé / Reste à charge / % couverture / Statut global
      - Add/edit/delete funding line via dialog
      - Invoice creation pre-selects funding source from dropdown if sources exist

  - proposed_id: P5
    title: "UI: Redesign Fiche tab — remove Financement section, add pédagogique + référencement fields"
    type: feature
    priority: P1
    estimate: large
    blocked_by: [P2]
    acceptance:
      - Remove entire "Financement" card from Fiche
      - Remove tjmFormateur field
      - Add read-only financing status chip with deep-link to Finances tab
      - Add "Pédagogique" section: objectifs (textarea), prerequis (textarea), publicVise (textarea), modalitesEvaluation (select)
      - Add RS code field (codeRs) and CPF fiche ID field (codeCpfFiche) adjacent to codeRncp
      - Add "Tarification" section: prixPublic, prixConvenu (both numeric inputs)
      - codeRncp, codeRs, codeCpfFiche each have inline contextual help text (see P6)
      - `prixConvenu` is flagged as required for convention generation (preflight update)

  - proposed_id: P6
    title: "Docs: in-product help/tooltip copy for Code RNCP / Code RS / Code CPF (French)"
    type: feature
    priority: P2
    estimate: small
    blocked_by: [P5]
    acceptance:
      - Code RNCP tooltip: "Numéro attribué par France Compétences aux certifications professionnelles enregistrées (titres, diplômes, CQP). Format : RNCP + 5 chiffres. Ne remplir que si cette formation prépare à une certification RNCP."
      - Code RS tooltip: "Identifiant d'une certification de compétences inscrite au Répertoire Spécifique (TOSA, PIX, SST, PCIE…). Format : RS + 4 chiffres. Ne remplir que si cette formation prépare à une certification RS."
      - Code fiche CPF tooltip: "Identifiant à 10 chiffres de votre fiche sur Mon Compte Formation (moncompteformation.gouv.fr). Ne s'applique qu'aux formations éligibles CPF (RNCP ou RS)."
      - Each tooltip includes a link to the France Compétences registry

  - proposed_id: P7
    title: "Backend: Extend document preflight — add prixConvenu + objectifs blocking"
    type: feature
    priority: P2
    estimate: small
    blocked_by: [P5]
    acceptance:
      - `prixConvenu = null` → block severity for convention document generation
      - `objectifs = null` → warn severity for programme and convention generation
      - `publicVise = null` → warn severity for programme generation
      - All new preflight items have correct focusKey pointing to Fiche fields

  - proposed_id: P8
    title: "Tech-debt: Rename formationType 'CPF' value or replace with cpfEligible boolean"
    type: tech-debt
    priority: P3
    estimate: small
    blocked_by: [P1]
    acceptance:
      - `formationType` enum value 'CPF' is either renamed to 'Inter_CPF' or the type field is split into format (Intra/Inter/Sur-mesure) + cpfEligible boolean
      - UI label on Fiche updated to reflect the change
      - No data loss during migration
```

---

## 7. Open Questions for the Human

**Q1 — Reste à charge responsibility model:** When a formation is partially funded, the reste à charge can be borne by the learner, by the employing company, or split between both. Does the app need to track reste à charge **per responsible party** (learner vs. employer), or is the global reste à charge amount sufficient for now? This determines whether `formationFundingSources` needs a `responsibleParty` field or whether the Finances UI just shows one total.

**Q2 — Multi-formateur TJM split with funding lines:** If a formation has 3 formateurs each with different TJMs, and the funding covers only part of the total cost, should the app attempt to split funding across formateurs proportionally? Or is funding always at the formation level, independent of which formateur does which sessions? This affects whether invoicing ties to formateurs or only to formations.

**Q3 — CPF formation type:** The current `formationType` enum has `['Intra', 'Inter', 'CPF']`. 'CPF' is not a format of delivery — it's a financing eligibility. The recommendation (P8) is to separate these axes. However, 'CPF' may currently drive quest logic (formation-quests calculates due dates based on `type`). Before removing it, confirm: is the quest logic for CPF formations based on the financing mechanism (CPF timeline rules) or on the delivery format? If the former, the quest engine needs to use `fundingSourceType` instead.

**Q4 — Referent handicap — workspace vs. formation level:** Qualiopi ind. 26 requires a named accessibility referent. In practice, most OFs have one referent handicap for the whole organization (workspace level), but some assign different referents per formation domain. Should `referentHandicap` live on the workspace settings page (simpler) or optionally be overridden per formation? A workspace-level default with formation-level override would satisfy both cases.

**Q5 — OPCO name as structured data vs. free text:** Currently, `payerLabel` in the proposed schema is a free text field. For the 11 main OPCOs (Atlas, Akto, AFDAS, Constructys, Uniformation, Opco EP, Ocapiat, OPCO 2i, Sante, Mobilités, Entreprises de Proximité), a structured enum or searchable list would enable filtering by OPCO across formations and trigger OPCO-specific document templates (some OPCOs have their own convention addendum requirements). Is this worth the additional complexity in V1, or should we start with free text and add structure later?

---

## Foundation Alignment Summary

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| Status-first | NEEDS WORK | Financing status is buried in an editable form card rather than surfaced as a status chip |
| Proactive intelligence | NEEDS WORK | Missing fields (objectifs, prixConvenu) silently prevent document generation without guidance |
| Context-appropriate urgency | NEEDS WORK | codeRncp shown for all formations without conditional logic or urgency when missing for certifying formations |
| Reward completion | ALIGNED | Progressive field completion pattern is correct; no punitive framing |
| Progressive disclosure | NEEDS WORK | TJM formateur shown with financing fields — cognitively noisy; pedagogical fields absent entirely |
| Smart defaults | NEEDS WORK | No defaults for funding sources; no conditional display of RNCP/RS/CPF codes based on formation type |
| Educational through use | NEEDS WORK | codeRncp has minimal help text; RS/CPF codes absent; Marie has no way to learn what these mean |
| Peace of mind | NEEDS WORK | Missing prixConvenu is a legal compliance gap that Marie can't know about from the current UI |

**Overall product verdict:** The Fiche is structurally sound in its UX pattern (inline editing, progressive disclosure) but has three serious gaps: (1) wrong financing data model creating a false sense of completeness, (2) key Qualiopi fields (objectifs, prerequis, publicVise, prixConvenu) exist in the schema but are invisible to Marie, (3) the referencing section (RNCP/RS/CPF) is half-built and cryptic.

**Compliance verdict:** GAPS EXIST. The most critical compliance gaps are: missing RS code for RS-certified formations (ind. 3), missing prixConvenu on Fiche (Article L6353-1 legal requirement for convention), missing objectifs/prerequis/publicVise on Fiche (ind. 1, 4, 5, 6), and missing referent handicap (ind. 26).
