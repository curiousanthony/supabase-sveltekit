# French UX Conventions & Admin SaaS Patterns

Reference for French-language UX copy, administrative SaaS UI patterns, and RGAA
accessibility notes. Read when generating copy recommendations or validating UI patterns
for French administrative tools.

---

## Table of Contents
1. French UX Copy Conventions
2. Administrative SaaS Mental Models
3. Qualiopi-Specific UX Context
4. RGAA Accessibility Quick Reference
5. Common French UI Anti-Patterns

---

## 1. French UX Copy Conventions

### Tone for administrative/compliance tools
- **Formal but direct**: French administrative culture expects precision. Avoid marketing language ("Boostez votre conformité!") in task-focused screens.
- **Verb-first CTAs**: "Télécharger le document", "Valider la session", "Compléter la tâche" — not "Document", "Validation".
- **Avoid false urgency**: "Urgent", "Critique" are strong words. Use them only when genuinely warranted — French administrative users are skeptical of manufactured urgency.

### Status labels (standard French admin conventions)
| Status | Preferred label | Avoid |
|--------|----------------|-------|
| Completed | "Validé" or "Complété" | "Done", "Fini" |
| In progress | "En cours" | "Started", "En train de" |
| Blocked | "Bloqué" | "Erreur", "Problème" |
| Available to start | "Disponible" | "Ouvert", "Accessible" |
| Locked (future) | "Verrouillé" | "Indisponible", "Pas encore" |
| Missing | "Manquant" | "Absent", "Pas uploadé" |

### Number and date formatting
- Dates: "14 mars 2025" (not 14/03/2025 in UI labels; numeric for table cells is fine)
- Percentages: "68 %" (space before %) — this is technically correct in French typography
- Currency: "1 200 €" (space as thousands separator)

### Error message copy
French admin users respond poorly to vague errors. Be specific:
- ❌ "Une erreur s'est produite"
- ✅ "Le fichier Présence_S3.pdf est manquant. Téléversez-le pour débloquer cette quête."

### Empty state copy
Empty states in French admin tools should never be left blank or with generic text:
- ❌ "Aucune donnée"
- ✅ "Aucune session planifiée pour le moment. Créez votre première session pour commencer le suivi Qualiopi."

---

## 2. Administrative SaaS Mental Models

French administrative managers (responsables administratifs, coordinateurs pédagogiques) operate with specific mental models:

### "Dossier" metaphor
French admin culture is deeply dossier-oriented. A "formation" is a physical dossier with required documents. UI that mirrors this mental model (items organized by document type, clear "pièces manquantes" language) will feel familiar.

### Audit anxiety
Qualiopi audits happen unpredictably (typically 2 years after certification, then cyclically). The user lives with latent audit anxiety. UI that communicates "you're ready for an audit right now" vs "you'd fail an audit right now" resonates strongly.

### Hierarchy of trust
French admin SaaS users trust:
1. Official references (DREETS, Cofrac, Qualiopi referentiel)
2. Their own organization's process
3. The software

The software must serve their process, not replace it. UI that feels too prescriptive ("you MUST do this") without explanation creates resistance.

### Validation culture
French administrative culture values double-checking and formal validation steps. "Marquer comme complété" buttons that require confirmation feel more trustworthy than auto-validation.

---

## 3. Qualiopi-Specific UX Context

### The 7 Criteria
Qualiopi is organized around 7 indicateurs de résultats and 32 critères. Users don't think in terms of "quests" — they think in terms of:
- **Pièces justificatives** (required evidence documents)
- **Indicateurs** (the numbered criteria: I.1, I.2, etc.)
- **Audits** (initial + surveillance + renouvellement)

### What triggers audit non-conformities
The most common non-conformities in audits relate to:
1. Missing signatures on attendance sheets (feuilles de présence)
2. Incomplete or undated training programs
3. Missing or undated learner satisfaction surveys
4. Educator CVs/certifications not on file
5. Absence of post-training follow-up evidence

These high-risk items should be surfaced prominently in the UI.

### Time sensitivity patterns
- **Before audit**: Extreme urgency, users want a checklist they can work through fast
- **During normal operations**: Moderate urgency, users want to process one formation at a time
- **Post-audit**: Low urgency for current cycle, users want to set up processes for next cycle

### Language of compliance
Use the official Qualiopi vocabulary:
- "Critère" not "règle"
- "Indicateur" not "métrique"
- "Pièce justificative" not "document" when referring to required evidence
- "Apprenant" not "élève" or "stagiaire" (though "stagiaire" is still common colloquially)
- "Organisme de formation" or "OF" not "école" or "centre"
- "Action de formation" not just "formation" in formal contexts

---

## 4. RGAA Accessibility Quick Reference

RGAA (Référentiel Général d'Amélioration de l'Accessibilité) is the French accessibility standard, equivalent to WCAG 2.1 AA.

### Key criteria for SaaS UIs
- **Color contrast**: Minimum 4.5:1 for normal text, 3:1 for large text (≥18pt or 14pt bold)
- **Focus indicators**: Visible focus ring on all interactive elements (don't remove outline without replacing)
- **Touch targets**: Minimum 44×44px (CSS px) per WCAG 2.5.5
- **Status labels**: Don't communicate status by color alone — always pair with text or icon
- **Form labels**: All inputs must have associated `<label>` elements (not just placeholder text)
- **Loading states**: Provide `aria-live` regions for dynamic content updates

### Common RGAA failures in compliance SaaS
- Status dots (colored only, no text) — fails criterion 3.1 (info not conveyed by color alone)
- Progress rings with percentage in SVG text — needs `aria-label` or `role="progressbar"`
- Expandable rows without `aria-expanded` — screen readers can't navigate

---

## 5. Common French Admin SaaS Anti-Patterns

These patterns appear frequently and consistently frustrate French administrative users:

### 1. The "everything is important" dashboard
Showing 12 alerts, 4 progress bars, and 6 status colors simultaneously. Trains users to ignore everything.
**Fix**: One primary signal. Surface the single most important action.

### 2. Unlabeled icon actions
Icon-only buttons in table rows (edit pencil, trash, eye) with no tooltip and no label.
**Fix**: Add visible text labels for primary actions; tooltips minimum for icon-only.

### 3. Silent success
User uploads a document. Nothing happens visually. Did it work?
**Fix**: Explicit success feedback — toast, inline color change, checkmark animation.

### 4. Premature "tout est conforme" messaging
Showing a high compliance score before all required documents are in place.
**Fix**: Compliance score should reflect actual audit-readiness, not task completion percentage.

### 5. Pagination without memory
User navigates to page 3 of a list, clicks an item, returns — back to page 1.
**Fix**: Preserve pagination state, or use infinite scroll with scroll position restoration.

### 6. Undefined "blocked" states
Item is blocked, but the UI only says "Bloqué" with no explanation of why or what to do.
**Fix**: Every blocked state must include: why it's blocked + what action unblocks it.

### 7. Destructive actions without confirmation
"Supprimer la session" with no confirmation dialog on a record with associated documents.
**Fix**: Confirm destructive actions; show what will be lost.
