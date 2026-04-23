# UX Review — T-13 Pre-Flight Validation (Error States with Fix Paths)

**Date**: 2026-04-13  
**Ticket**: T-13  
**Persona**: Marie (admin OF, France)  
**Refs**: `docs/decisions/2026-04-09-chunk2-document-lifecycle-ux.md` §6, `docs/team-artifacts/product/2026-04-13-T-13-preflight-validation.md`  
**Primary surface**: `src/routes/(app)/formations/[id]/documents/+page.svelte` (generate flow); cross-tab deep links to Fiche, Séances, Apprenants, Suivi.

---

## TL;DR

- **Single highest-impact fix**: After "[Compléter →]", Marie must have an obvious **return path** to the same generation intent (sticky affordance + optional URL resume), or she loses context and repeats clicks (Zeigarnik / anxiety).
- **Framing**: Avoid a wall of red Xs on first open; use **progress** ("3 sur 5 prêts") and **two severities** (block vs warn) with **non–color-only** status (icon + text).
- **Two checklist row types**: **Missing data** → field-level deep link; **Prerequisite not met** (quest ordering) → Suivi / Documents action link — different mental models; mixing them confuses Marie.
- **Compliance**: Log **optional** "generate despite warnings" to `formation_audit_log` (traceability); matrix below resolves analyst open questions where the decision doc is silent.
- **Scope coordination**: Per-learner partial readiness belongs primarily to **T-14**; T-13 defines the **row model** (global vs per-learner) so batch UI can extend without redesign.

---

## Personas & Hypotheses

| Persona | Hypothesis |
|---------|------------|
| Marie | If the checklist opens only when she chooses **Générer**, she feels guided, not punished (reward completion). |
| Marie | If returning from a fix shows **"Continuer la génération — [Convention]"**, she completes the task in one session (reduced abandonment). |
| Auditor (indirect) | If warning overrides are logged, Marie feels safer clicking "Générer quand même" when the business accepts the risk. |

---

## Click-Path Analysis

| Goal | Current (approx.) | Ideal | Friction |
|------|-------------------|-------|----------|
| Generate doc | Dropdown → type → optional dialog → POST | Dropdown → **checklist step** → confirm / fix | Cognitive: no readiness preview |
| Fix missing field | N/A | One click → correct tab → **focus target** | Motor + Emotional: fear of getting lost |
| Unblock prerequisite | N/A | CTA → Suivi quest or Documents row action | Cognitive: quest vs field |
| Return | Back button / memory | **Resume banner** + `?resumeGenerate=` deep link | Temporal |

---

## Resolved: Blocking / Warning / Prerequisite Matrix (defaults)

*Decision §6 defines only examples; below is the **Design Council default** for implementation. "Block" prevents **Générer**; "Warn" allows generation after explicit confirm; "Prerequisite" blocks with a **non-field** fix path.*

| Document type | Block (data) | Warn (data) | Prerequisite (quest / legal ordering) | Notes |
|---------------|--------------|-------------|----------------------------------------|-------|
| **Devis** | No client linked; no title/intitulé; no `dateDebut` / `dateFin`; no price/total | No workspace logo; no workspace NDA numéro | — | NDA warn escalates to **block** for certificat/facture when OPCO financing (see below). |
| **Convention** (B2B / personne morale) | No client (PM); missing dates; missing duration (hours); missing price; missing **objectifs** if required by template | Logo missing; NDA missing | **Devis** must be **accepté** (quest Q04) before convention generation | Fix: "[Valider le devis dans le Suivi →]" not a Fiche field. |
| **Contrat / convention B2C** (personne physique) | Same core fields as convention where the template applies; **email contact** if required for delivery | Same optional warns | Devis accepté if commercial path uses devis | **Rétractation**: if `dateDebut` − today `< 10` days, show **warning** (not block unless product later decides): copy references délai légal 10 jours — Marie confirms in checklist. |
| **Ordre de mission** | No **formateur** linked to formation; missing dates covering mission | Logo / NDA optional | Convention **signée** or acceptable substitute per product rules — **default**: convention status `signe` **or** formation flag "ordre sans convention" if such exists; else **prerequisite** row linking to Documents/Suivi | If no explicit flag exists at build time, implement **convention signée** only and log follow-up ticket for edge cases. |
| **Feuille d'émargement** | No **séance** selected; séance without **date**; no **formateur** on séance/formation; **zero** enrolled learners for that séance | Room/location empty (soft — warn) | — | Matches decision: séance required. |
| **Convocation** | Learner **email** missing; formation **dateDebut** missing; neither **lieu** nor **lien visio** (if modality needs one) | — | **Convention signée** (Ind. 9 default) | Fix: "[Voir la convention →]" / Suivi. |
| **Certificat de réalisation** | **Émargements** not all **signed** for the learner/session scope; learner identity incomplete (name) | — | Q11 complete for relevant séance(s) | Ties to émargement legality. |
| **Attestation** | **Évaluation des acquis** (Q16b) incomplete for learner | — | Q18 gating | Not in `GENERATABLE_TYPES` today — include rules for when enabled. |
| **OPCO / financement** (cross-cut) | If `typeFinancement` (or equivalent) indicates **OPCO / financement organisme**: missing **NDA** → **block** on **certificat** (and **facture** on Finances tab when that flow exists) | NDA missing on devis/convention | — | Aligns analyst note: payment risk vs optional branding. |

---

## Findings

### 🔴 Critical

| ID | Location | Observed vs expected | Mechanism | Impact (1–5) | Recommendation |
|----|----------|------------------------|-----------|--------------|----------------|
| C1 | Generate flow | Direct POST without readiness | Zeigarnik | 5 | Insert checklist **before** submit; sync rules server-side. |

### 🟠 Major

| ID | Location | Mechanism | Recommendation |
|----|----------|-----------|----------------|
| M1 | Cross-tab navigation | Working memory overload | **Resume** banner + query `resumeGenerate` + `documentType`; re-open checklist. |
| M2 | Quest vs field | Wrong mental model | Separate **row kinds** and CTAs. |
| M3 | Warnings | No trace | Log `generation_with_warnings` (see plan). |

### 🟡 Minor

| ID | Recommendation |
|----|----------------|
| m1 | Progress copy: "X sur Y prêts" in dialog header. |
| m2 | Server validation message maps to same checklist codes for parity. |

### 🔵 Polish

| p1 | Compact checklist on mobile; touch targets ≥ 44px for primary actions. |

---

## Prioritized Recommendations

1. **Checklist modal/step** inside generate flow with **block / warn / prerequisite** rows and **server-side mirror** of rules.
2. **Deep links**: `/formations/[id]/fiche?focus=…` (and séances/apprenants) + `scrollIntoView` + `focus()` on first focusable control; document stable `data-preflight-field` or `id` map in plan.
3. **Return path**: `sessionStorage` key `preflightResume` **or** URL `?resumeGenerate=<type>`; on Documents mount, open checklist for that type; **toast** optional after successful save on destination tab.
4. **A11y**: Status = **icon + text** ("Prêt" / "Manquant" / "Action requise"); `aria-describedby` from disabled **Générer** to live region summarizing blockers; link **accessible name** = full sentence, not only "Compléter →".
5. **Warning confirm**: Second step or checkbox + **Générer quand même** → audit log entry.
6. **T-14**: Reuse checklist item type for per-learner rows (email missing, etc.) without changing block/warn semantics.

---

## Future considerations

- Auto-refresh checklist when `invalidateAll` after return (already used on Documents).
- "Voir les étapes" collapsed summary for brand-new formations if product wants proactive surfacing outside generate.
