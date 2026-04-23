# Chunk 2 UX Brainstorm: Document Lifecycle + Documents Tab Redesign

**Date**: 2026-04-09
**Scope**: T-9 / T-10 — Rich document lifecycle states, Documents tab UX overhaul
**Persona**: Marie, 34, administrative manager, 12 formations active, interrupted constantly
**Prior art**: `docs/decisions/2026-04-07-document-generation-system.md` (§2, §8, §11)

---

## TL;DR

1. **Don't organize by phase — organize by attention.** The UX foundation is clear: Marie thinks in urgency, not audit phases. Phase grouping should be a *secondary filter*, not the primary layout. The Documents tab should mirror the Suivi tab's pattern: actionable items first, then completed, then archived.
2. **Lifecycle states should be invisible infrastructure, not visible complexity.** Marie doesn't manage document states — the system does. Show her *what to do next* (send this, get this signed), not *what state something is in*.
3. **Contextual prompts belong at the quest level, not the Documents tab.** The Suivi tab already guides Marie step-by-step. The Documents tab should be a *reference library*, not a second action center. Quest deep-links should scroll-to-and-highlight, not spawn duplicate CTAs.
4. **Batch generation is the single most impactful UX win.** "Générer toutes les convocations" saves Marie 12 clicks per formation. This is the magic wand moment.
5. **Regeneration needs a per-document inline indicator, not a global banner.** Five stale documents need five individual decisions. A global banner creates ambiguity about which ones.

---

## 1. Phase Grouping Layout

### The Tension

The decision doc (§11) says "documents grouped by Conception/Déploiement/Évaluation." But the UX foundation (§5.3) is explicit:

> Primary organization: TIME + URGENCY. Secondary context: PHASE. Don't organize the default view by phase.

These contradict. Phase grouping makes logical sense to an architect but violates Marie's mental model. She doesn't come to the Documents tab thinking "show me Conception documents." She comes thinking "what documents do I have, and are any missing?"

### Proposed Pattern: Urgency-First with Phase Chips

**Default view**: Documents sorted by `generatedAt` descending (newest first). Each document row has a small phase chip (Conception / Déploiement / Évaluation) derived from the quest that triggered it. This provides phase context without phase-based navigation.

**Filtering**: Add a phase filter alongside the existing type and status filters. Three chip buttons: `Conception` | `Déploiement` | `Évaluation`. These filter the flat list — they don't restructure into accordion sections.

**Rationale (Hick's Law)**: Accordion groups force Marie to decide which section to open. A flat list with filters lets her scan everything at once (most formations will have 5–15 documents, not 50).

### Alternative Considered: Accordion Sections

Three collapsible sections with document counts. Problem: documents that span phases or don't belong to quests (manually uploaded) need an "Autre" section, creating a fourth group. Cognitive load increases (4 groups × decision to expand = 4 decisions before Marie sees anything). Rejected for default view.

**Compromise**: Offer a "Grouper par phase" toggle in the filter bar. When active, switches to accordion layout. This serves the audit-prep use case ("show me all Conception docs before the auditor arrives") without polluting the daily workflow.

### Phase-to-Document Mapping

| Document type | Primary phase | Can appear in multiple phases? |
|---|---|---|
| Devis | Conception | No |
| Convention | Conception | No |
| Ordre de mission | Conception | No |
| Convocation | Conception | No |
| Feuille d'émargement | Déploiement | No |
| Certificat | Évaluation | No |
| Attestation | Évaluation | No |
| Uploaded docs | Varies (from quest) | Yes (if uploaded across quests) |

Most documents map cleanly to one phase. The `phase` field should come from the quest that generated the document, stored on `formation_documents`.

---

## 2. Document Lifecycle Visibility

### The Psychology

Marie doesn't think in state machines. She thinks in action readiness:
- "Can I send this?" → Not yet sent
- "Did they sign this?" → Waiting for response
- "Is this done?" → All steps completed

The per-type status sets from §2 of the decision doc (généré → envoyé → signé → archivé, etc.) are **correct as system infrastructure** but **wrong as primary UI**. Showing Marie a "signé" badge on a convention creates a false sense that she needs to understand and manage these transitions.

### Proposed Pattern: Action-Oriented Status with Progressive Disclosure

**Primary display**: Each document shows ONE of these human-readable states via a colored badge:

| Visual state | Badge | Color | Meaning |
|---|---|---|---|
| Ready to send | `À envoyer` | Blue | Generated, not yet emailed |
| Sent, waiting | `En attente` | Amber | Emailed, waiting for response |
| Action needed | `Action requise` | Red | Needs Marie's decision (e.g. accepté/refusé for devis) |
| Complete | `Terminé` | Green | All lifecycle steps done |
| Stale | `Données modifiées` | Orange outline | Formation data changed since generation |

**Mapping from system states to display states:**

| Document type | System state | Display state |
|---|---|---|
| Convention | `généré` | `À envoyer` |
| Convention | `envoyé` | `En attente` (waiting for signature) |
| Convention | `signé` | `Terminé` |
| Convention | `archivé` | `Terminé` (with archive icon) |
| Devis | `généré` | `À envoyer` |
| Devis | `envoyé` | `En attente` (waiting for client decision) |
| Devis | `accepté` | `Terminé` |
| Devis | `refusé` | `Refusé` (grey, struck) |
| Devis | `expiré` | `Expiré` (grey) |
| Convocation | `généré` | `À envoyer` |
| Convocation | `envoyé` | `Terminé` |
| Feuille d'émargement | `généré` | `En cours` |
| Feuille d'émargement | `signatures_en_cours` | `En cours` (with progress: 3/12 signatures) |
| Feuille d'émargement | `signé` | `Terminé` |
| Certificat | `généré` | `À envoyer` |
| Certificat | `envoyé` | `Terminé` |

**Progressive disclosure**: Clicking/expanding a document row reveals the detailed lifecycle timeline (mini stepper showing généré → envoyé → signé with timestamps). This satisfies power users and audit-prep scenarios without cluttering the default view.

### Why Not a Timeline Per Document?

A visible timeline (like a multi-step progress bar) per document creates "Completionist Anxiety" (UX foundation §6.2). Marie sees 15 documents, each with a timeline showing incomplete steps — that's 15 sources of low-grade stress. The action-oriented badge reduces this to a single glanceable signal per document.

### Automatic Transition Feedback

When a status changes automatically (e.g., Marie sends an email and the convention moves from `généré` to `envoyé`), the document row should:
1. Briefly flash/highlight (200ms border-color transition)
2. Badge updates in place
3. Toast notification: "Convention mise à jour : envoyée" (optional, could be noisy — consider only for the first few times)

No sound effects — the Documents tab is a reference view, not the primary action center. Sounds are reserved for the Suivi tab's quest completions.

---

## 3. Contextual Generation Prompts

### The Problem

The decision doc proposes contextual banners: "Le devis est prêt à être généré — [Générer le devis →]". But where should these live?

### Current Flow Analysis

Today, document generation happens in TWO places:
1. **Suivi tab → quest → inline-generate-document**: Marie clicks "Générer Convention" inside the quest card
2. **Documents tab → "Générer un document" dropdown**: Marie manually picks a type

This duality is already confusing. Adding a THIRD surface (contextual banners on Documents tab) makes it worse.

### Proposed Pattern: Quest-Driven Generation, Documents as Library

**Principle**: The Suivi tab is where Marie *does work*. The Documents tab is where she *reviews results*.

**Generation prompts should NOT appear on the Documents tab.** Instead:

1. **Suivi tab quests remain the primary generation trigger.** The existing `inline-generate-document` component is already well-designed — button → loading → success.

2. **Documents tab shows a "Next step" chip on generated documents.** If a convention has been generated but not sent, the document row shows: `À envoyer` badge + a subtle "Envoyer →" button that navigates back to the relevant quest's send sub-action. This closes the loop without duplicating the quest UI.

3. **Quest deep-links to Documents tab**: When a quest sub-action says "Vérifier le document généré", the CTA should link to `/formations/{id}/documents?highlight={documentId}` — the Documents tab scrolls to and briefly highlights that specific document row. No banner needed; the highlight IS the context.

4. **Empty-state prompt**: If Marie is on the Documents tab and zero documents exist, the empty state already says "Utilisez le bouton « Générer un document » pour créer votre premier document." Enhance this: "Consultez l'onglet Suivi pour générer vos premiers documents étape par étape." This redirects her to the guided flow.

### One Exception: Regeneration Prompt

The contextual generation prompt is warranted only for regeneration (see §5 below), because regeneration is a document-level concern, not a quest-level one.

### Deep-Link Protocol

When navigating from Suivi → Documents:
- URL: `/formations/{id}/documents?highlight={documentId}&from=suivi`
- Behavior: Smooth-scroll to the document row, apply a 2s yellow border-glow animation, then fade
- `from=suivi` query param: enables a "← Retour au suivi" breadcrumb link at the top

When navigating from Documents → Suivi (for "next step"):
- URL: `/formations/{id}/suivi?quest={questKey}&subAction={index}`
- Behavior: Expand the quest card and scroll to the relevant sub-action

---

## 4. Batch Generation UX

### Marie's Pain Point

With 12 apprenants, generating convocations today requires:
1. Click "Générer un document" (1 click)
2. Select "Convocation" (1 click)
3. Select apprenant from dropdown (1 click)
4. Click "Générer" (1 click)
5. Repeat 11 more times (44 more clicks)

**48 clicks** for 12 convocations. This is the single worst UX bottleneck in the document system.

### Proposed Pattern: "Générer pour tous" Button

**In the Suivi tab quest card** (convocations quest → "Générer les convocations" sub-action):

Replace the current single-generate button with a two-part UI:

```
┌─────────────────────────────────────────────────────┐
│  📄 Générer les convocations                        │
│                                                     │
│  12 apprenants inscrits                             │
│  ┌──────────────────────┐  ┌─────────────────────┐  │
│  │ Générer pour tous    │  │ Choisir un apprenant│  │
│  │     (recommandé)     │  │         ▾           │  │
│  └──────────────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

- **"Générer pour tous"** (primary button): Generates all convocations in a single server request. Shows a progress indicator during generation.
- **"Choisir un apprenant"** (secondary/outline button): Opens the existing single-select dropdown for edge cases (regenerate for one person, generate for a late-added learner).

### Progress & Error Handling

During batch generation:

```
┌─────────────────────────────────────────────────────┐
│  Génération en cours...                             │
│  ████████████░░░░░░  8/12                           │
│                                                     │
│  ✓ Alice Dupont                                     │
│  ✓ Bob Martin                                       │
│  ✗ Claire Leroy — Email manquant                    │
│  ⏳ David Petit...                                  │
└─────────────────────────────────────────────────────┘
```

**If some fail**: Show partial success + failures with fix paths:

```
┌─────────────────────────────────────────────────────┐
│  ✓ 10 convocations générées                         │
│  ✗ 2 échecs :                                       │
│    • Claire Leroy — Email manquant [Compléter →]    │
│    • Eve Girard — Adresse manquante [Compléter →]   │
│                                                     │
│  [Réessayer les 2 échecs]                           │
└─────────────────────────────────────────────────────┘
```

"Compléter →" navigates to the Apprenants tab with the contact pre-focused. "Réessayer les 2 échecs" retries only the failed ones.

### On the Documents Tab

After batch generation, the Documents tab shows a **group row** for per-learner documents (see §7). Marie doesn't see 12 individual convocation rows cluttering her view.

### Which Document Types Support Batch?

| Type | Batch? | Why |
|---|---|---|
| Convocation | Yes | Per-learner, always all at once |
| Certificat | Yes | Per-learner, generated post-formation |
| Attestation | Yes (future) | Per-learner |
| Convention | No | One per formation |
| Devis | No | One per formation |
| Ordre de mission | Partially | Per-formateur, usually 1–2 |
| Feuille d'émargement | No | Per-séance, auto-generated in Chunk 3 |

---

## 5. Regeneration Prompt

### The Decision (from §8)

When `formation.updatedAt > document.generatedAt`, show a regeneration prompt. Current code replaces the old document on regeneration.

### Proposed Pattern: Per-Document Inline Indicator

**Not a global banner.** If Marie has 3 stale documents, a banner saying "Les données ont changé — Régénérer ?" is ambiguous. Which 3? Do I regenerate all? What if I only want to regenerate the devis but not the convention (which was already signed)?

Instead, each stale document shows:

```
┌──────────────────────────────────────────────────────────┐
│ 📄 Convention                        ⚠ Données modifiées│
│    Jean Dupont · 15 mar. 2026                            │
│                                                          │
│    Les informations de la formation ont changé           │
│    depuis la génération de ce document.                  │
│    [Voir les changements]  [Régénérer]  [Ignorer]        │
└──────────────────────────────────────────────────────────┘
```

- **"Voir les changements"** (ghost button): Opens a small popover showing which fields changed (e.g., "Durée : 14h → 21h", "Date de début : 15/04 → 22/04"). This is critical for Marie's decision — she may not care about a description edit but absolutely needs to regenerate after a date change.
- **"Régénérer"** (outline button): Regenerates immediately, replaces old document, updates `generatedAt`.
- **"Ignorer"** (text link): Dismisses the warning for this document. Sets a `regenerationDismissedAt` timestamp — warning won't reappear unless the formation changes again *after* the dismissal.

### Status Guard

If a document's system state is `envoyé` or later (it's been sent to someone), the prompt escalates:

```
⚠ Ce document a déjà été envoyé au client.
   Régénérer créera une nouvelle version.
   [Régénérer et renvoyer]  [Ignorer]
```

"Régénérer et renvoyer" generates the new PDF and opens the send-email flow for the relevant quest. This is a significant action — the button should be amber/destructive-styled to communicate weight.

If the document is `signé` or `archivé`, regeneration should be blocked:

```
ℹ Ce document est déjà signé. Pour le modifier,
   créez une nouvelle version via l'avenant.
```

(Avenants are out of scope for Chunk 2, but the guardrail should exist.)

### Batch Regeneration

If 3+ documents are stale simultaneously, show a banner *above the document list*:

```
⚠ 3 documents nécessitent une mise à jour
   [Tout régénérer]  [Voir les détails]
```

"Voir les détails" scrolls to the first stale document. "Tout régénérer" only regenerates documents that haven't been sent yet (status = `généré`). Already-sent documents are excluded with a message: "2 régénérés, 1 ignoré (déjà envoyé — vérifiez manuellement)."

### What Fields Trigger Staleness?

Not every formation update should trigger regeneration prompts. A new contact added doesn't make the convention stale. Relevant fields per document type:

| Document type | Fields that trigger staleness |
|---|---|
| Convention | name, dateDebut, dateFin, duree, modalite, prixConvenu, prixPublic, client |
| Devis | name, dateDebut, dateFin, duree, prixConvenu, prixPublic, client, apprenants count |
| Convocation | name, dateDebut, dateFin, lieu, contact email/name |
| Ordre de mission | name, dateDebut, dateFin, lieu, formateur TJM/days |
| Feuille d'émargement | séance time/date, apprenants list |
| Certificat | name, dateDebut, dateFin, duree, contact name |

Implementation: Store a hash of relevant field values at generation time on `formation_documents.dataHash`. Compare against current hash on load. Much more reliable than `updatedAt` comparison, which triggers on any formation edit.

---

## 6. Error States

### Pre-Flight Validation (Before Generation)

**Current state**: The generate dialog only validates that a person/séance is selected. It doesn't check if the formation has enough data to produce a valid document. Errors happen *during* PDF generation (server-side) and show as generic "Erreur de génération" toasts.

**Proposed pattern: Pre-flight check in the UI.**

When Marie selects a document type from the "Générer un document" dropdown (or clicks "Générer" in a quest), the system runs client-side validation before hitting the server:

```
┌─────────────────────────────────────────────────────┐
│  ⚠ Impossible de générer le devis                   │
│                                                     │
│  Informations manquantes :                          │
│  ✗ Prix convenu non renseigné     [Compléter →]     │
│  ✗ Adresse du client manquante    [Compléter →]     │
│  ✓ Dates de formation                               │
│  ✓ Durée                                            │
│  ✓ Client rattaché                                  │
│                                                     │
│  [Annuler]                                          │
└─────────────────────────────────────────────────────┘
```

Each "Compléter →" link navigates to the specific tab/field:
- Prix → Finances tab or Fiche tab
- Client address → CRM contact page
- Dates → Fiche tab
- Formateur → Formateurs tab

**Validation rules per document type:**

| Document type | Required fields |
|---|---|
| Convention | name, dateDebut, dateFin, duree, client (with address), prixConvenu or prixPublic |
| Devis | name, dateDebut, dateFin, duree, client (with address, SIRET), prixConvenu or prixPublic |
| Convocation | name, dateDebut, dateFin, lieu, contact (with email) |
| Ordre de mission | name, dateDebut, dateFin, formateur (with name), TJM, numberOfDays |
| Feuille d'émargement | séance (with startAt, endAt), apprenants list |
| Certificat | name, dateDebut, dateFin, duree, contact (with name) |

**Psychological mechanism (Zeigarnik Effect)**: Showing what's complete alongside what's missing gives Marie a sense of partial progress ("I already have 3/5, just need to fill in 2 more"). Pure error lists feel punishing; checklists feel achievable.

### Post-Generation Error States

If the server-side generation fails despite pre-flight passing (edge cases, PDF rendering errors):

```
✗ Erreur lors de la génération du devis
   Le serveur n'a pas pu créer le PDF.
   [Réessayer]  [Signaler un problème]
```

"Signaler un problème" creates an error log entry (future: sends to support). Don't just show a toast — a toast disappears; the error state should persist on the document row until resolved.

### Persistent Warnings on the Documents Tab

For documents that *could* be generated but would be incomplete/invalid:

```
⚠ Certificat — Claire Leroy
   Données insuffisantes : durée effective non calculable
   (aucun émargement signé pour cette apprenante)
   [Voir les séances →]
```

This appears as a warning-styled card in the document list, not a generated document. It's a "ghost document" — the system knows this document *should* exist but can't generate it yet. This reduces Marie's anxiety: she can see the gap and knows what to fix, rather than discovering it during an audit.

---

## 7. Per-Learner Document Collapsing

### The Problem

A formation with 12 apprenants generates 12 convocations, 12 certificats, 12 attestations. Without collapsing, the Documents tab shows 36+ rows for what are conceptually 3 document types.

### Proposed Pattern: Group Row with Expand

```
┌──────────────────────────────────────────────────────────┐
│ 📬 Convocations                          ✓ Terminé       │
│    12/12 générées · 12/12 envoyées                       │
│    [▾ Détails]                                           │
└──────────────────────────────────────────────────────────┘
```

Clicking "Détails" expands to show individual rows:

```
┌──────────────────────────────────────────────────────────┐
│ 📬 Convocations                          ✓ Terminé       │
│    12/12 générées · 12/12 envoyées                       │
│    [▴ Masquer]                                           │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Alice Dupont         Envoyé     15 mar.  👁 🗑   │  │
│  │  Bob Martin           Envoyé     15 mar.  👁 🗑   │  │
│  │  Claire Leroy         ⚠ Échec    —        [Fix →] │  │
│  │  ...                                               │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

### Group Row Status Logic

The group row's badge reflects the *aggregate* status:

| Condition | Badge |
|---|---|
| All generated, none sent | `À envoyer` (blue) |
| Some sent, some not | `En cours` (amber) — "8/12 envoyées" |
| All sent | `Terminé` (green) |
| Some failed | `Action requise` (red) — "2 échecs" |
| None generated | `À générer` (grey outline) |

### Auto-Expand on Error

If any individual document in the group has an error, the group row auto-expands to show the error rows. Non-error rows stay collapsed. This follows the "surface what needs attention, hide what doesn't" principle.

### Grouping Rules

Only group documents of the **same type that share a generation batch context**:
- 12 convocations generated from "Générer pour tous" → one group
- 1 convocation generated manually later → separate individual row (or appended to existing group if same type)

In practice, always group by `(type, formationId)` — simpler and more predictable.

### Mixed-State Groups

If 10 convocations are "envoyé" and 2 are "généré" (Marie sent 10 but 2 learners were added later):

```
📬 Convocations                     En cours (10/12 envoyées)
   ⚠ 2 nouvelles convocations à envoyer
```

The sub-text highlights the incomplete items without forcing Marie to expand.

---

## 8. Devis Accept/Refuse

### The Business Decision

When a client responds to a devis, Marie needs to record the outcome. This is a **manual** transition (§2 of decision doc) because it's a business event the system can't detect.

### Where Should Marie Click?

**Primary: In the Suivi tab, on the devis quest's "Obtenir la validation" sub-action.**

This sub-action is type `wait-external` with `waitingFor: 'Client'`. Currently it just has a "Terminé" toggle. Enhance it:

```
┌─────────────────────────────────────────────────────┐
│  ⏳ Obtenir la validation du devis                  │
│     En attente du Client                            │
│                                                     │
│  ┌──────────────┐  ┌──────────────┐                 │
│  │ ✓ Accepté    │  │ ✗ Refusé     │                 │
│  └──────────────┘  └──────────────┘                 │
│                                                     │
│  [Envoyer une relance]                              │
└─────────────────────────────────────────────────────┘
```

- **"Accepté"**: Updates devis status to `accepté`, completes the sub-action, marks the quest as `Terminé`, triggers convention quest unlock. Brief celebration: toast "Devis accepté ! La prochaine étape est la convention."
- **"Refusé"**: Opens a confirmation dialog: "Êtes-vous sûr ? Le devis sera marqué comme refusé." Updates status to `refusé`. The quest is marked `Terminé` but with a different outcome. Formation status may need a decision (continue? abandon? create new devis?).

**Secondary: In the Documents tab, on the devis document row.**

When the devis is in `envoyé` state, the document row shows:

```
📄 Devis                               En attente
   Entreprise XYZ · 22 mar. 2026
   [Marquer comme accepté]  [Marquer comme refusé]  👁
```

These buttons trigger the same server action as the quest sub-action. Both surfaces stay in sync because they write to the same `formation_documents.status` field and the same quest sub-action completion state.

### Refusé Flow

When Marie clicks "Refusé":

```
┌─────────────────────────────────────────────────────┐
│  Devis refusé                                       │
│                                                     │
│  Que souhaitez-vous faire ?                         │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ 📄 Créer un nouveau devis                    │   │
│  │    Ajustez les conditions et renvoyez.        │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ 🗂 Archiver et continuer sans devis          │   │
│  │    La formation continue sans devis formel.   │   │
│  └──────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────┐   │
│  │ ❌ Annuler la formation                       │   │
│  │    Aucune action supplémentaire.              │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  [Décider plus tard]                                │
└─────────────────────────────────────────────────────┘
```

This follows the Peak-End Rule: the worst moment (client refusal) should end with a clear, empowered choice. Marie isn't abandoned — the system asks "what now?" and offers concrete options.

### Expiration

If `devis.generatedAt + workspace.defaultDevisValidityDays` has passed and status is still `envoyé`:

```
📄 Devis                               Expiré
   Entreprise XYZ · 22 mar. 2026
   Validité dépassée (30 jours)
   [Régénérer avec nouvelles dates]  [Marquer comme accepté]
```

"Marquer comme accepté" remains available — the client may have accepted verbally after expiration. The system is pragmatic, not rigidly rule-based.

---

## 9. Document Versioning

### The Question

When Marie regenerates a document, does the old version disappear or stay as history?

### Proposed Pattern: Replace with Audit Trail

**The old PDF file is replaced.** But:

1. **`formation_documents` keeps a `version` counter** (integer, starts at 1, increments on regeneration).
2. **A `document_history` table** stores: `documentId`, `version`, `generatedAt`, `storagePath` (pointing to the old file before deletion), `dataHash`, `generatedBy`.
3. **Default UI**: Marie sees only the current version. No confusion.
4. **Audit view** (future, not Chunk 2): A small "v3" chip on the document row. Clicking it shows: "Version 1 — 15 mar. · Version 2 — 22 mar. · Version 3 (actuelle) — 29 mar." with ability to download old versions.

### Why Not Keep History Visible by Default?

Marie doesn't need to see that the convention was regenerated 3 times. She needs to see the *current* convention. History is for auditors and edge cases (recovering a version that was accidentally regenerated). The UX foundation is clear: progressive disclosure, show only what's needed.

### Implementation Note

For Chunk 2 MVP, skip the `document_history` table. Just increment `version` on `formation_documents` and replace the storage file. History tracking is a Chunk 3+ concern. The important thing is to **design the field now** so we don't have to retrofit later.

---

## 10. Documents Tab Overall Layout (Synthesized)

Putting it all together, here's the proposed layout:

```
┌──────────────────────────────────────────────────────────┐
│  📁 Documents                          [12]              │
│                                 [+ Générer un document ▾]│
├──────────────────────────────────────────────────────────┤
│  ⚠ 2 documents nécessitent une mise à jour               │
│    [Tout régénérer]  [Voir]                              │
├──────────────────────────────────────────────────────────┤
│  Filtres:                                                │
│  [Tous les types ▾]  [Tous ·7] [À envoyer ·2]           │
│  [En attente ·1] [Terminé ·4]                            │
│  ☐ Grouper par phase                                     │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  📄 Convention          À envoyer       CONCEPTION       │
│     Entreprise XYZ · 15 mar. 2026              👁 🗑     │
│     ⚠ Données modifiées [Régénérer]                      │
│                                                          │
│  📄 Devis               En attente      CONCEPTION       │
│     Entreprise XYZ · 14 mar. 2026              👁 🗑     │
│     [Accepté] [Refusé]                                   │
│                                                          │
│  📬 Convocations (12)   Terminé         CONCEPTION       │
│     12/12 générées · 12/12 envoyées    [▾ Détails]       │
│                                                          │
│  📄 Ordre de mission    Terminé         CONCEPTION       │
│     Pierre Formateur · 16 mar. 2026            👁 🗑     │
│                                                          │
│  📋 Feuille d'émarg.   En cours         DÉPLOIEMENT      │
│     Séance 1 — 22 mar. · 8/12 signatures       👁       │
│                                                          │
│  ...                                                     │
│                                                          │
├──────────────────────────────────────────────────────────┤
│  📨 Communications (5)  [▸ Développer]                   │
└──────────────────────────────────────────────────────────┘
```

### Key Layout Decisions

1. **Stale-documents banner at top** — only appears when 2+ documents are stale. For 1 stale document, the per-document indicator suffices.
2. **Filters row** — type dropdown + display-state chips (not system states). Phase chips hidden by default, appear when "Grouper par phase" is checked.
3. **Document rows** — sorted by status priority (action needed → à envoyer → en attente → en cours → terminé), then by date. Not by generation date. Urgency-first.
4. **Phase chip** — small, muted, right-aligned label. Context, not navigation.
5. **Group rows** — for per-learner document types, collapsing by default.
6. **Actions inline** — devis accept/refuse buttons visible directly on the row (no expand required). Preview and delete icons on every row.
7. **Communications section** — kept at bottom, collapsed by default (same as today).

---

## 11. Identified Tensions & Trade-offs

### Tension 1: Suivi Tab vs Documents Tab Ownership

**Risk**: If both tabs let Marie generate, send, accept/refuse documents, they become redundant. Marie won't know where to go.

**Resolution**: Clear role separation:
- **Suivi** = guided workflow (do the next thing)
- **Documents** = reference library (see what exists, manage document-level concerns)

Suivi handles: generate, send, mark as signed/accepted. Documents handles: preview, delete, regenerate, version history, audit prep.

The only overlap is devis accept/refuse, which must be accessible from both because Marie may discover the client's response while browsing documents, not while doing quest work.

### Tension 2: Simplicity vs Audit Readiness

**Risk**: Hiding lifecycle states behind display states makes audit prep harder. An auditor might ask "show me all signed conventions" — and Marie can't filter for that.

**Resolution**: The "Grouper par phase" toggle + system state filtering (available via a "Filtres avancés" disclosure) serve audit-prep scenarios. Daily use stays simple; audit prep gets power tools when needed.

### Tension 3: Batch Generation vs Individual Control

**Risk**: "Générer pour tous" might generate documents for apprenants Marie intended to exclude (e.g., someone who dropped out but hasn't been removed from the formation).

**Resolution**: Pre-flight validation. Before batch generation, show a list of who will receive documents with checkboxes (all checked by default). Marie can uncheck individuals. This adds one screen but prevents errors.

### Tension 4: Regeneration Noise

**Risk**: If Marie frequently edits formation data (common during the conception phase), every edit triggers regeneration warnings on all generated documents. This becomes noise.

**Resolution**: Data hashing (§5) with smart field selection. Only fields that materially affect a document type trigger staleness. And the "Ignorer" action has memory — dismissed warnings don't reappear until a *new* change occurs.

---

## 12. Prioritized Recommendations

Ordered by impact on Marie's daily experience:

| # | Recommendation | Severity | Effort | Impact |
|---|---|---|---|---|
| 1 | Batch generation for per-learner documents | 🔴 Critical | Medium | Eliminates 40+ clicks per formation |
| 2 | Action-oriented display states (À envoyer / En attente / Terminé) | 🔴 Critical | Medium | Reduces cognitive load from 5 states to 3 concepts |
| 3 | Pre-flight validation with fix paths | 🟠 Major | Medium | Eliminates generation failures and "find the missing field" frustration |
| 4 | Per-learner document collapsing (group rows) | 🟠 Major | Medium | Prevents tab from becoming unusable with 12+ apprenants |
| 5 | Per-document regeneration indicator | 🟡 Minor | Low | Catches stale documents without anxiety-inducing banners |
| 6 | Devis accept/refuse flow with next-step options | 🟡 Minor | Medium | Smooth business workflow for a key decision point |
| 7 | Deep-link protocol (Suivi ↔ Documents) | 🟡 Minor | Low | Reduces context-switching friction |
| 8 | Phase chips (not groups) as default | 🔵 Polish | Low | Phase context without phase-based reorganization |
| 9 | Automatic status transitions (backend) | 🔴 Critical | High | Required infrastructure for all display state logic |
| 10 | Document versioning field (version counter) | 🔵 Polish | Low | Future-proofs for audit trail |

### Recommended Build Order

1. **Backend first**: Implement per-type status fields + automatic transitions (§9 above). Without this, all display state logic is impossible.
2. **Display states**: Map system states to action-oriented display states in the UI.
3. **Group rows**: Per-learner collapsing — needed before batch generation makes sense.
4. **Batch generation**: "Générer pour tous" with pre-flight validation.
5. **Regeneration**: Data hash + per-document indicator.
6. **Devis accept/refuse**: UI for the manual transition.
7. **Deep-links**: Suivi ↔ Documents navigation protocol.
8. **Phase chips + filters**: Last, because they're polish.

---

## Appendix: Quick Audit Checklist Applied

| # | Check | Current State | Chunk 2 Target |
|---|---|---|---|
| 1 | Primary action prominence | "Générer" button small, top-right | Keep position but add batch option |
| 2 | Info hierarchy matches decisions | Flat list, no priority | Sorted by action urgency |
| 3 | Empty & error states | Basic empty state, toast errors | Rich empty state + inline errors with fix paths |
| 4 | Mobile affordances | Rows are compact, should work | Ensure touch targets on action buttons ≥ 44px |
| 5 | Cognitive load at peak stress | 12 convocation rows visible | Collapsed to 1 group row |
| 6 | Status clarity ("where am I") | Status badge per doc | Action-oriented badge + phase chip |
| 7 | Irreversible actions guarded | Delete has confirmation | Regeneration of sent docs has warning |
| 8 | Feedback loops | Toast on generation | Toast + inline status update + row highlight |
| 9 | Consistency | Status badges match Suivi style | Display states align with quest display states |
| 10 | Exit & recovery | Delete is permanent | Versioning counter enables future undo |
