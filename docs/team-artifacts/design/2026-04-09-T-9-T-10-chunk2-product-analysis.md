# Chunk 2 — Document Lifecycle + Documents Tab UX: Product & Qualiopi Analysis

**Date**: 2026-04-09
**Analyst**: Product Foundation Guardian + Qualiopi Compliance
**Scope**: Rich document lifecycle states, automatic transitions, contextual prompts, phase grouping, error states, regeneration, batch generation

---

## 1. Summary

- **Foundation alignment**: STRONG overall. The lifecycle design aligns with status-first, proactive intelligence, and peace-of-mind principles. Two areas need work: regeneration UX risks creating anxiety, and phase grouping in the Documents tab contradicts the foundation's "organize by urgency, not by phase" mandate.
- **Qualiopi compliance**: STRONG with one critical gap. The lifecycle creates an excellent audit trail for indicators 1, 6, 9, 11, 17, 21, 27, 30. The gap: **no versioning** — Qualiopi auditors may need to see that a devis was modified and why. The current "replace on regeneration" approach could destroy audit evidence.
- **Key tension**: Phase grouping in Documents tab vs. urgency-first principle. Resolution: use phases as a secondary organizational layer, but surface overdue/needed documents above phase groups.
- **Biggest risk**: Document versioning. If Marie regenerates a convention after the client already signed version 1, the original is lost. This is both a compliance risk and a trust risk.
- **Biggest opportunity**: The automatic transitions (email sent → envoyé, quest completed → signé) are exactly what the magic-wand test demands — Marie manages actions, not states.

---

## 2. Foundation Alignment

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| Status-first (not data-first) | **ALIGNED** | Per-type status values (généré/envoyé/signé/accepté) immediately answer "where is this document?" — no interpretation needed. |
| Proactive intelligence (not passive display) | **ALIGNED** | Automatic transitions (email → envoyé, all signatures → signé) mean Marie never manages document states manually. The system infers state from actions. |
| Context-appropriate urgency | **NEEDS WORK** | Phase grouping organizes by lifecycle stage, not urgency. A devis expiring tomorrow and a convention signed last month get equal visual weight within their phase group. Need an urgency layer on top. |
| Reward completion (don't punish incompletion) | **ALIGNED** | States like `signé` and `accepté` are positive completions. The design should show "3/5 documents ready" not "2 missing." |
| Progressive disclosure | **ALIGNED** | Phase groups with expand/collapse + per-learner document collapsing are good progressive disclosure. Documents Marie doesn't need to think about are hidden. |
| Smart defaults, zero configuration | **ALIGNED** | Auto-transitions mean zero configuration for state management. Devis expiry uses workspace-level `defaultDevisValidityDays` — set once, applies everywhere. |
| Educational through use | **ALIGNED** | Phase labels (Conception/Déploiement/Évaluation) teach Qualiopi structure. Status labels (généré → envoyé → signé) teach the expected workflow without a manual. |
| Peace of mind as primary goal | **NEEDS WORK** | Regeneration prompts ("Les données ont changé — Régénérer ?") could create anxiety: "Did I send a wrong document? Is the old one invalid now?" Needs careful framing. |

### Magic Wand Test

If Marie had a magic wand:
- She would want documents to track their own state automatically. **Passed** — automatic transitions do this.
- She would want to know instantly which documents are missing or stuck. **Partially passed** — phase grouping shows this, but needs an urgency overlay.
- She would want to never accidentally destroy a signed document. **Failed** — current regeneration replaces without versioning.
- She would want batch operations ("send all convocations"). **Passed** — batch generation is in scope.

### Competitor Fear Test

A competitor offering per-type document lifecycle with auto-transitions would be genuinely differentiated. Most training management tools use flat status (draft/final) or no status at all. The quest-driven contextual prompts ("Le devis est prêt — Générer →") are a significant UX advantage. **Passed.**

---

## 3. Lifecycle States — Completeness Check

### 3.1 Devis: généré → envoyé → accepté | refusé | expiré

**Assessment: ADEQUATE with caveats**

| Proposed state | Verdict | Notes |
|----------------|---------|-------|
| `généré` | Keep | Clear starting point |
| `envoyé` | Keep | Auto-triggered by email send |
| `accepté` | Keep | Manual — critical business event, unlocks convention quest |
| `refusé` | Keep | Manual — but needs a "reason" field for Qualiopi indicator 32 (continuous improvement) |
| `expiré` | **Keep but make non-blocking** | See analysis below |

**"En cours de négociation" — SKIP for v1.**
- This is a real business state (client pushes back on price, Marie adjusts), but it complicates the state machine without adding Qualiopi value.
- The quest system already handles this: the `devis` quest has a `wait-external` sub-action ("Obtenir la validation du devis"). While Marie waits, the quest shows "En attente — Client". This is enough.
- **Future consideration**: If we add multiple devis versions per formation (price negotiation rounds, §7.3 below), negotiation becomes implicit — v1 was sent, v2 was sent after feedback. No explicit "négociation" state needed.

**"Expiré" — useful but must not block.**
- Expiry provides useful information: "This devis was sent 45 days ago and the client never responded."
- It should NOT block regeneration. Marie should be able to generate a new devis even if the old one expired.
- **Recommendation**: `expiré` triggers a gentle nudge ("Ce devis a expiré — Relancer le client ou créer un nouveau devis ?") rather than a hard block.
- Auto-expiry should transition `envoyé → expiré` only. Never expire a `généré` devis — that's just a document Marie hasn't sent yet.

**Missing state: "annulé" — ADD.**
- If the formation is cancelled or the client disappears, the devis should be explicitly marked `annulé` rather than just sitting as `envoyé` forever.
- Transition: manual (Marie clicks "Annuler") OR automatic when formation status becomes "Annulée" (if such a status exists).
- This is important for audit trail clarity: auditor sees `annulé` and understands the story.

### 3.2 Convention: généré → envoyé → signé → archivé

**Assessment: STRONG**

| Proposed state | Verdict | Notes |
|----------------|---------|-------|
| `généré` | Keep | |
| `envoyé` | Keep | Auto from email |
| `signé` | Keep | Auto from quest sub-action completion |
| `archivé` | Keep | Auto from parent quest completion |

**"Signé par une partie" vs "signé par les deux" — SKIP for v1.**
- In practice, for B2B conventions in the OF world, the OF signs first (pre-signed), then sends to the client. When the client returns the signed copy, the convention is `signé`.
- A "partially signed" state adds complexity without Qualiopi value — the auditor cares about "was it signed before J0?", not how many parties signed first.
- The quest sub-action "Obtenir la signature" already models this: it's completed when the client's signed copy is received. The convention PDF itself is the OF's version.
- **If digital signature (DocuSign, Yousign) is added later**: the signature platform handles multi-party tracking. The document status in Mentore Manager just reflects the final outcome.

**Missing state: "annulé" — ADD (same as devis).**
- Formation cancelled after convention sent → convention should be `annulé`.

### 3.3 Feuille d'émargement: généré → signatures_en_cours → signé → archivé

**Assessment: ADEQUATE — consider simplifying**

The granularity is justified IF the digital émargement system is the primary mechanism. Here's why:

| State | Trigger | Value to Marie |
|-------|---------|----------------|
| `généré` | PDF created (pre-session blank or post-session proof template) | "The sheet is ready" |
| `signatures_en_cours` | First digital signature collected | "People are signing" — useful for multi-day formations where not all learners sign on day 1 |
| `signé` | All expected signatures collected | "Compliance achieved for this séance" — peace of mind |
| `archivé` | Émargement quest completed | "Done, filed away" |

**Is this overengineering?** No, because:
1. The `emargements` table already tracks per-signature timestamps — the state is computed, not manually set.
2. `signatures_en_cours` tells Marie "3/5 learners signed, 2 missing" which is immediately actionable (she can chase the missing ones).
3. Qualiopi auditors specifically look for "all signatures present" — the `signé` state is audit evidence.

**Recommendation**: Keep all 4 states but ensure `signatures_en_cours` displays progress (e.g., "3/5 signatures") rather than just the state label.

### 3.4 Convocation / Certificat: généré → envoyé → archivé

**Assessment: STRONG — simple and correct.**

These are informational documents. No signature or acceptance step needed. The only meaningful events are generation, sending, and archiving.

### 3.5 Ordre de mission: généré → envoyé → signé → archivé

**Assessment: STRONG — mirrors convention.**

Same lifecycle as convention. The formateur receives it, signs it, returns it. The quest sub-action "Collecter la copie signée" drives the `envoyé → signé` transition.

### 3.6 Documents that are generated but never sent (abandoned formations)

**This is a real scenario and needs handling.**

- Formation goes dormant (client never responds, dates never set, etc.)
- Documents sit as `généré` indefinitely.
- **Recommendation**: Do NOT auto-clean or auto-expire generated documents. They serve as evidence that work was done.
- **Do**: When a formation status becomes terminal ("Annulée", "Archivée"), cascade an `annulé` status to all documents that are still in `généré` or `envoyé` state (not to `signé` or `archivé` — those are completed).
- **Visual treatment**: In the Documents tab, `annulé` documents should be visually muted (grey, collapsed) but not hidden — they're part of the formation's story.

---

## 4. Qualiopi Audit Trail

### 4.1 Indicators Impacted by Document Lifecycle

| Indicator | Description | How lifecycle helps | Gap? |
|-----------|-------------|---------------------|------|
| **1** | Information du public (tarifs) | Devis lifecycle proves pricing was communicated: `généré` → `envoyé` with timestamp = proof of delivery. | No gap |
| **6** | Contenus, modalités, contractualisation | Convention lifecycle proves contractualization: `signé` with timestamp + `signedAt` field = proof. Must show convention was signed **before** formation started (compare `signedAt` vs `dateDebut`). | **Potential gap**: Need to surface "convention signed after formation started" as a compliance warning. |
| **9** | Information des bénéficiaires | Convocation `envoyé` with timestamp = proof learners were informed. Règlement intérieur transmission tracked via separate quest. | No gap |
| **11** | Évaluation de l'atteinte des objectifs | Certificat de réalisation lifecycle + feuille d'émargement `signé` = proof of completion and attendance. | No direct gap, but attestation (deferred to Chunk 5) is the key document here. |
| **17** | Moyens humains et techniques | Ordre de mission `signé` = proof formateur was formally engaged. | No gap |
| **21** | Compétences des intervenants | Ordre de mission + formateur documents quest = proof of qualification. | No gap (covered by quest, not just document lifecycle) |
| **27** | Sous-traitance | Ordre de mission to external formateur = proof of formalized sub-contracting. | **Potential gap**: Need to distinguish internal vs. external formateurs on the ordre de mission. Currently `formation_formateurs` doesn't track this — but `formateurs` table might. |
| **30** | Recueil des appréciations | Satisfaction questionnaires tracked via quests, not generated documents. | N/A for document lifecycle |

### 4.2 Audit Trail Sufficiency

**Current schema strengths:**
- `formation_documents.generatedAt` — when the document was created
- `formation_documents.sentAt` + `sentTo` — when and to whom it was sent
- `formation_documents.signedAt` — when it was signed
- `formation_emails` — separate email log with `postmarkMessageId` for delivery proof
- `formation_audit_log` — field-level change tracking on formations

**What must be provable during an audit:**

| Audit question | Current proof mechanism | Sufficient? |
|---------------|------------------------|-------------|
| "Convention was signed before formation started" | `signedAt` < `dateDebut` | Yes, if `signedAt` is reliably set |
| "Devis was sent to client" | `sentAt` + `formation_emails` record | Yes |
| "All learners signed the attendance sheet" | `emargements` table (per-signature, timestamped) | Yes — source of truth is the `emargements` table, not the PDF |
| "Certificat de réalisation was issued" | `formation_documents` with type `certificat` + `generatedAt` | Yes |
| "Convention was regenerated after changes" | **NO** — current code replaces the document, losing v1 | **GAP** |
| "Devis was sent, client refused, new devis was sent" | **PARTIAL** — only if multiple `formation_documents` rows exist for type `devis` | **GAP** — see versioning (§6) |

### 4.3 Qualiopi-Mandated States or Transitions

Qualiopi does not prescribe specific document states — it requires **proof of actions performed**. The lifecycle states are our design choice to track those proofs. However:

- **Convention must be signed before J0**: This is a legal requirement (Code du travail art. L.6353-1), not just Qualiopi. The system should WARN if formation `dateDebut` is approaching and convention is not `signé`.
- **Émargement must exist for every séance**: The system should ALERT if a séance occurred but no émargement is `signé` (or `signatures_en_cours`).
- **Certificat de réalisation must be issued within reasonable time after completion**: No legal deadline, but auditors expect it within 30 days of `dateFin`.

**Recommendation**: Add computed compliance warnings that cross-reference document lifecycle states with formation dates. These are not document states themselves but overlay alerts:

1. `Convention not signed, formation starts in X days` — surfaces at day -7
2. `Séance occurred without complete émargement` — surfaces at day +1 after séance
3. `Formation ended X days ago, certificat not yet issued` — surfaces at day +15 after `dateFin`

These warnings align perfectly with the "proactive intelligence" and "context-appropriate urgency" foundation principles.

---

## 5. Automatic vs. Manual Transitions

### 5.1 Transition Classification

| Transition | Auto or Manual | Trigger | Rationale |
|-----------|----------------|---------|-----------|
| `généré → envoyé` (all types) | **AUTO** | `formation_emails` record created with matching `documentId` | Sending is an observable action. No ambiguity. |
| `envoyé → accepté` (devis) | **MANUAL** | Marie clicks "Devis accepté" | Business decision learned from client. The system can't know this automatically. |
| `envoyé → refusé` (devis) | **MANUAL** | Marie clicks "Devis refusé" | Same as above. |
| `envoyé → expiré` (devis) | **AUTO** | `generatedAt + devisValidityDays < now()` AND status is `envoyé` | Timer-based. Should run on page load or scheduled job, not real-time. |
| `envoyé → signé` (convention, ordre_mission) | **AUTO** | Quest sub-action "Obtenir la signature" / "Collecter la copie signée" marked complete | Quest completion is the trigger. |
| `signé → archivé` (convention, ordre_mission) | **AUTO** | Parent quest marked "Terminé" | Quest lifecycle drives document lifecycle. |
| `généré → signatures_en_cours` (émargement) | **AUTO** | First `emargements` row with `signedAt` for the related séance | Observable from the database. |
| `signatures_en_cours → signé` (émargement) | **AUTO** | All expected `emargements` rows have `signedAt` | Computed state. |
| `envoyé → archivé` (convocation, certificat) | **AUTO** | Parent quest completed | Quest lifecycle. |
| `* → annulé` (any type) | **SEMI-AUTO** | Formation cancelled → cascade to non-terminal documents. Also manual via Marie. | Need both paths. |

### 5.2 Edge Case: Postal Mail

**Scenario**: Marie sends a convention by postal mail, not through the app.

**Current design problem**: `généré → envoyé` is triggered by `formation_emails` record. If Marie mails a physical copy, no email record exists, so the document stays as `généré` forever.

**Recommendation**: Add a manual "Marquer comme envoyé" action on the document card. This creates a synthetic transition without an email record. The UI should be:
- Default: "Envoyer par email" (creates email + auto-transitions)
- Secondary: "Marquer comme envoyé (envoi postal/manuel)" (just transitions the status + records `sentAt`)
- This covers fax, hand-delivery, and postal mail.

**For Qualiopi**: The audit trail for postal sends is weaker (no Postmark delivery receipt), but a timestamped status change is sufficient. Marie should be prompted to note the sending method in a comment or metadata field.

### 5.3 Edge Case: Formation Cancelled

**Scenario**: Documents are generated (some even sent), then the formation is cancelled.

**Recommendation**:
1. When formation status → "Annulée": show a confirmation dialog listing affected documents.
2. Auto-cascade `annulé` to documents in `généré` or `envoyé` state.
3. Documents already `signé` or `archivé` stay — they're historical facts.
4. Special case: if devis is `accepté` and convention is `signé`, cancellation is a significant event that may require a written notice to the client. Surface a prompt: "La convention est déjà signée — un avenant d'annulation est peut-être nécessaire."

### 5.4 Edge Case: Devis Expiry and Regeneration

**Should expiry block regeneration?** No.

- Expiry means the old devis is no longer valid. Marie should be able to generate a new devis freely.
- The expired devis stays in the timeline as `expiré` (historical record).
- New devis starts fresh as `généré`.
- **This implies multiple devis per formation** — the schema already supports this (multiple `formation_documents` with `type: 'devis'`). But the Documents tab needs to show them chronologically with clear status labels.

---

## 6. Phase Grouping — Qualiopi Alignment

### 6.1 Phase ↔ Document Mapping

| Phase | Documents | Qualiopi alignment |
|-------|-----------|-------------------|
| **Conception** | Devis, Convention, Convocation, Ordre de mission, Feuille d'émargement (blank/pre-session) | Aligns with Qualiopi Phase 1 (Q01-Q09c). All documents in this phase are produced before the formation starts. |
| **Déploiement** | Feuille d'émargement (proof/post-session) | Aligns with Qualiopi Phase 2 (Q10-Q15). Only émargement is a generated document here — other déploiement activities produce uploaded documents (adaptation notes, etc.). |
| **Évaluation** | Certificat de réalisation, Attestation (future), Facture (future) | Aligns with Qualiopi Phase 3 (Q16-Q25). |

### 6.2 Alignment Verdict: ADEQUATE

The three phases map cleanly to Qualiopi's audit structure. An auditor reviewing by phase would find documents in the expected locations.

### 6.3 Documents That Don't Fit Neatly

| Document | Problem | Recommendation |
|----------|---------|----------------|
| **Feuille d'émargement (blank)** | Generated in Conception but used during Déploiement. | Show in **Déploiement** — the blank sheet is a delivery tool, not a conception artifact. Group it with its séance. |
| **Feuille d'émargement (proof)** | Generated post-séance, which is Déploiement. But the last séance's proof might be generated during Évaluation timing. | Show in **Déploiement** grouped by séance. Don't overthink timing — the séance determines the phase. |
| **Règlement intérieur** | Not currently a generated document — it's an uploaded document in the `reglement_interieur` quest. | Leave as a quest upload for now. If we later generate a templated règlement intérieur, it would go in Conception. |

### 6.4 Foundation Tension: Phase Grouping vs. Urgency-First

The UX foundation explicitly warns against organizing by phase:

> "Phases provide structure, but don't organize the default view by phase. Phase context appears as supporting information, not primary navigation."

**This means the Documents tab should NOT default to a phase-grouped view.**

**Recommendation**: The Documents tab default view should be:

1. **Urgency zone (top)**: Documents that need action NOW — contextual banners, missing documents, regeneration prompts, expiring devis.
2. **All documents (middle)**: Flat list sorted by recency or status (pending first, completed last). Each row shows its phase as a small badge, not a group header.
3. **Phase view (toggle)**: A secondary view toggle ("Par phase") that groups by Conception/Déploiement/Évaluation. Useful for audit preparation but not the daily workflow.

This resolves the tension: Marie's daily workflow is urgency-first, but when preparing for an audit, she can switch to phase view to verify completeness per phase.

---

## 7. Error States — Missing Data Impact

### 7.1 Fields That MUST Block Generation (Compliance Risk)

These fields are legally required on the document. Generating without them creates a non-compliant document that could harm Marie if sent.

| Document | Blocking fields | Qualiopi/legal basis |
|----------|----------------|---------------------|
| **Devis** | `name` (intitulé), `duree`, `dateDebut`, workspace `raison_sociale`/`siret`/`nda`, client name+address | Art. L.6353-1 + Qualiopi ind. 1: tarifs must be communicated with full identification |
| **Convention** | Everything from devis + `prixConvenu` or `prixPublic`, `objectifs`, programme content, client company info | Art. L.6353-1: convention is a legal contract. Missing fields = legally void. |
| **Convocation** | `name`, `dateDebut`, `location` (or equivalent for distanciel), at least 1 apprenant with email | Qualiopi ind. 9: learners must be informed of practical details |
| **Certificat** | `name`, `dateDebut`, `dateFin`, `duree`, at least 1 apprenant, workspace identity | Art. R.6332-26: certificat is a legal document with prescribed content |
| **Feuille d'émargement** | `name`, related séance with date + times, at least 1 apprenant, formateur assigned | Art. R.6313-3: émargement is a legal obligation |
| **Ordre de mission** | `name`, `dateDebut`, `dateFin`, formateur assigned, `formation_formateurs.tjm` | Qualiopi ind. 17, 21: formal engagement of the trainer |

### 7.2 Fields That Should WARN (Nice to Have)

| Document | Warning fields | Why warn, not block |
|----------|---------------|---------------------|
| **Devis** | `dateFin`, `location`, number of participants = 0 | Devis can be sent with "dates à confirmer" — common in early negotiation |
| **Convention** | `publicVise`, `prerequis`, `modaliteEvaluation` on modules | Legally required but Marie might want to generate a draft for internal review |
| **Convocation** | `modalite` (if null, can't determine présentiel vs distanciel info) | Can default to generic wording |
| **Ordre de mission** | `location`, `deplacementCost`, `hebergementCost` | Financial details can be "à définir" |

### 7.3 Minimum Viable Data per Document Type

| Document | Absolute minimum for Qualiopi | Notes |
|----------|-------------------------------|-------|
| **Devis** | Intitulé + durée + prix HT + identité OF + identité client | Without price, it's not a devis. Everything else can say "à préciser." |
| **Convention** | Everything on the devis + objectifs + programme summary + conditions | Legal contract — every prescribed field is mandatory. |
| **Convocation** | Intitulé + date + lieu + identité apprenant | Must tell the learner where and when to show up. |
| **Certificat** | Intitulé + dates + durée effective + identité apprenant + identité OF | Prescribed by ministerial model (art. R.6332-26). |
| **Émargement** | Intitulé + date/horaires de la séance + liste des apprenants + identité formateur + identité OF (NDA) | Legal obligation (art. R.6313-3). |
| **Ordre de mission** | Intitulé + dates + lieu + identité formateur + conditions financières (TJM, total) | Must formalize the engagement. |

### 7.4 Error State UX Recommendation

Foundation principle: "Reduce anxiety" > "Provide clarity" > "Enable action."

Error messages should follow this pattern:
```
[Icon: info, not error] "Pour générer le devis, complétez :"
• Durée du programme → [Compléter →]
• Prix convenu → [Compléter →]
```

**NOT this pattern** (anxiety-inducing):
```
[Icon: red X] "ERREUR: Impossible de générer — 3 champs manquants"
```

The fix-path CTAs should deep-link to the correct tab with the field pre-focused. The error state is temporary — once Marie fills in the data, the "Générer" button becomes active without requiring a page refresh.

---

## 8. Regeneration — Compliance Implications

### 8.1 Must the old version be kept?

**Yes — for any document that has been sent (`envoyé` or later).**

Qualiopi doesn't explicitly mandate document versioning. However:

1. **Audit trail integrity**: If Marie sends devis v1 at 5000€, the client negotiates, and she sends devis v2 at 4500€, the auditor needs to see both versions to understand the pricing history (especially for OPCO-funded formations where the amount must match the accord de prise en charge).

2. **Legal protection**: If a dispute arises about what was agreed, having only the latest version is dangerous. The original sent document is the one the client received.

3. **Qualiopi indicator 32 (amélioration continue)**: Changes to documents (programme updates reflected in convention, pricing adjustments) are evidence of continuous improvement — but only if both versions are visible.

**Recommendation**:
- Documents in `généré` state (never sent): regeneration **replaces** the document. No version history needed — Marie is iterating before sending.
- Documents in `envoyé` or later: regeneration creates a **new document row** with an incremented version indicator. The old document stays with its original status.
- Signed documents (`signé`, `archivé`): regeneration is **blocked** by default. Show: "Ce document a été signé. Pour le modifier, créez un avenant." Exception: feuille d'émargement proof can be regenerated if new signatures come in.

### 8.2 Versioning Data Model

The current schema supports this without changes — just create a new `formation_documents` row for each version. To track lineage:

- Add `metadata.version` (integer, starting at 1)
- Add `metadata.previousVersionId` (UUID, nullable — points to the prior document)
- The Documents tab shows the latest version prominently, with a "Voir l'historique" link to previous versions

This is lightweight and doesn't require schema migration.

### 8.3 Signed Documents — Can They Be Regenerated?

| Document type | Regeneration after signing? | Rationale |
|--------------|---------------------------|-----------|
| **Convention** | **No** — requires an avenant (contractual amendment) | A signed convention is a legal contract. Unilateral modification is void. The app should guide Marie to create an avenant document instead. |
| **Ordre de mission** | **No** — same logic, it's a signed engagement | |
| **Devis** | N/A — devis doesn't have a `signé` state. `accepté` = final. | After acceptance, changes require a new devis (which makes the old one superseded). |
| **Feuille d'émargement** | **Yes** — regeneration means re-rendering the proof PDF with updated signature data | The PDF is a rendering of the `emargements` table. If new signatures come in, the proof PDF should be regenerated to include them. |
| **Convocation** | **Yes** — but rare. If dates change after convocations sent, new convocations should be generated and re-sent. | Old convocation stays as `envoyé` (historical). New one is generated fresh. |
| **Certificat** | **Caution** — only if the source data (attendance, dates) was corrected. Should prompt: "Les données de présence ont changé. Régénérer le certificat ?" | Certificat is a legal document (art. R.6332-26). Changes must be justified. |

---

## 9. Edge Cases and Risks

### 9.1 Formation Cancelled Mid-Lifecycle

**Scenario**: Formation has devis `accepté`, convention `signé`, convocations `envoyé`, then formation is cancelled.

**Qualiopi impact**: None directly (cancelled formations aren't audited), BUT:
- OPCO may need to be notified (if funding was approved)
- Learners need to be informed (convocation was sent)
- Convention cancellation may have financial implications (cancellation terms)

**Recommendation**:
1. When formation status → "Annulée", show a checklist of required actions:
   - "Convention signée — Notifier le client de l'annulation ?"
   - "Convocations envoyées — Informer les apprenants ?"
   - "Financement OPCO accordé — Prévenir l'OPCO ?"
2. Auto-transition non-terminal documents to `annulé`
3. Keep all documents accessible (not deleted) — they're part of the formation history

### 9.2 Client Changes After Convention Signed

**Scenario**: Different contact person at the client company after convention is signed.

**Qualiopi impact**: Low. The convention is with the company (personne morale), not the individual contact. A change of contact person doesn't invalidate the convention.

**Recommendation**:
- Allow updating the client contact on the formation without affecting the signed convention.
- If the company itself changes (rare — typically means a completely different deal), require a new convention.
- No document regeneration needed for contact person changes.

### 9.3 Multiple Devis for Same Formation (Price Negotiation)

**Scenario**: Marie sends devis v1 at 5000€. Client pushes back. Marie sends devis v2 at 4500€. Client accepts v2.

**Current system**: Only one `formation_documents` row with type `devis`. Regeneration replaces it.

**Recommended approach (per §8.1)**:
1. Marie generates devis v1, sends it → status: `envoyé`
2. Client negotiates → Marie clicks "Créer un nouveau devis" (not "Régénérer")
3. System creates a new `formation_documents` row: devis v2, status: `généré`
4. v1 stays as `envoyé` (or manually marked `expiré`/`refusé`)
5. Marie sends v2 → status: `envoyé`
6. Client accepts → Marie marks v2 as `accepté`
7. Documents tab shows: "Devis v2 (accepté) — Devis v1 (refusé)" with v2 prominent

**Qualiopi value**: Full audit trail of the commercial negotiation. Indicator 1 (information du public) is satisfied by showing transparent pricing history.

### 9.4 OPCO-Funded Formations — Specific Document Requirements

**OPCO adds these specific requirements to documents:**

| Document | OPCO-specific requirement | Already handled? |
|----------|--------------------------|-----------------|
| **Devis** | Must match the OPCO-approved amount exactly | Formation has `montantAccorde` field. Chunk 2 should validate: devis `prixConvenu` ≠ `montantAccorde` → warning. |
| **Convention** | OPCO may require specific clauses (depending on the OPCO) | Not currently handled. OPCO-specific convention templates are a future feature. For now, workspace-level `defaultCancellationTerms` covers basic clauses. |
| **Certificat de réalisation** | Must use the ministerial template (modèle officiel) | Already using the official template in the PDF builder. |
| **Feuille d'émargement** | Must be sent to OPCO with justificatifs | Covered by `justificatifs_opco` quest. |

**Additional OPCO documents NOT currently generated:**
- **Formulaire de demande de prise en charge**: OPCO-specific forms (each OPCO has their own). Cannot be generated — must be filled on the OPCO's platform. Already handled by `demande_financement` quest as `external-link`.
- **CPS (contrat de prestation de services)**: Issued by the OPCO, not the OF. Uploaded via quest, not generated.

**Recommendation for OPCO formations**: Add a validation check in the Documents tab that verifies devis amount matches `montantAccorde` (if financement is OPCO and `montantAccorde` is set). Display: "Le montant du devis (5000€) ne correspond pas au montant accordé par l'OPCO (4500€). Vérifiez ou régénérez le devis."

---

## 10. Batch Generation for Per-Learner Documents

### 10.1 Which Documents Are Per-Learner?

| Document | Per-formation or per-learner? | Batch needed? |
|----------|------------------------------|---------------|
| Devis | Per-formation | No |
| Convention | Per-formation (intra) or per-company (inter) | No (but inter requires one per company — future scope) |
| Convocation | **Per-learner** | **Yes** — "Générer toutes les convocations" |
| Certificat | **Per-learner** | **Yes** — "Générer tous les certificats" |
| Attestation (future) | **Per-learner** | **Yes** |
| Feuille d'émargement | Per-séance (all learners on one sheet) | No |
| Ordre de mission | Per-formateur | Rare (usually 1 formateur) |

### 10.2 Batch Generation UX

**Foundation alignment**: "If the app CAN do it proactively, it SHOULD."

Batch generation should be the default, not the exception:
- When Marie clicks "Générer les convocations" on the quest, it generates ALL convocations in one action.
- A progress indicator shows: "Génération en cours — 3/5 convocations…"
- After completion: "5 convocations générées — [Envoyer à tous →]"
- Individual convocations can be viewed/downloaded from the collapsed group.

**Error handling in batch**:
- If 4/5 convocations generate successfully but 1 fails (missing learner email):
  - Show success for 4 + specific error for 1
  - "4 convocations générées. 1 échec : Jean Dupont — email manquant — [Compléter →]"
  - Don't block the batch for one failure

### 10.3 Qualiopi Note

Per-learner documents are critical for Qualiopi because auditors can ask for **any specific learner's** dossier. The system must make it trivial to find all documents for learner X across all formations. This is a future feature (cross-formation learner view) but the per-learner document generation lays the groundwork.

---

## 11. Questions for the Team

1. **Versioning in metadata vs. separate table**: Is storing `version` and `previousVersionId` in the `metadata` JSONB field sufficient, or should we add proper columns? JSONB is flexible but not queryable with foreign keys. If we need to query "show me all versions of this devis", a `parentDocumentId` column would be better.

2. **"Annulé" state scope**: Should `annulé` apply only when the formation is cancelled, or should Marie be able to manually cancel individual documents (e.g., "This convocation was for the wrong learner")?

3. **Devis expiry computation**: Should expiry be computed on-the-fly (check `generatedAt + validityDays` on every page load) or stored as a scheduled status update? On-the-fly is simpler but means the database status doesn't reflect reality until someone views the document.

4. **Postal mail tracking**: For the "Marquer comme envoyé" manual action (postal sends), should we track the sending method (`email` vs `postal` vs `hand_delivery`) in a `metadata.sendingMethod` field? This adds audit trail value.

5. **Inter-enterprise convention multiplication**: For inter formations, we'll eventually need one convention per company. Should the Documents tab already account for this grouping (even if not yet implemented), or design for single-convention-per-formation and refactor later?

---

*This analysis should be read alongside the prior design decisions document (`docs/decisions/2026-04-07-document-generation-system.md`) which establishes the lifecycle states and chunk boundaries. This analysis validates those decisions against the product foundation and Qualiopi requirements, and surfaces gaps the implementation team must address.*
