# Product Analysis — T-13: Pre-Flight Validation (Error States with Fix Paths)

**Date**: 2026-04-13  
**Ticket**: T-13  
**Analyst**: product-analyst  
**Audience**: UX designer (Design Council, Phase 1 Step B)

---

## Summary

- **Foundation alignment**: MOSTLY ALIGNED — concept is correct, but framing risk (red X everywhere = punishment) and missing return-navigation pattern could undermine peace-of-mind goal.
- **Compliance verdict**: GAPS EXIST — validation rules only defined for 2 of 7 document types; B2C contrat, OPCO-specific fields, and dependency sequencing (can't generate convention before devis accepté) are unspecified.
- **Key tension**: Complete validation coverage vs. progressive disclosure. Showing 8 red items on a new formation is overwhelming.
- **Blocking gap**: No return-to-generation path defined after Marie completes a "[Compléter →]" fix. This is the most critical missing UX flow.
- **Audit trail gap**: Proceeding despite warnings is not logged; Qualiopi ind. 32 (amélioration continue) requires traceable decisions.

---

## Foundation Alignment

| Principle | Verdict | Rationale |
|-----------|---------|-----------|
| Status-first | ALIGNED | Checklist answers "Is this ready?" before any action |
| Proactive intelligence | NEEDS WORK | Should surface incomplete data proactively in Documents tab, not only as a generation blocker |
| Context-appropriate urgency | NEEDS WORK | Blocking vs. warning distinction is correct, but visual hierarchy between 1 blocker and 5 warnings is unspecified |
| Reward completion | NEEDS WORK | "Red X / 3 erreurs bloquantes" framing punishes incompletion. Should frame as "Prêt à générer (3/5 — [Compléter les 2 manquants])" |
| Progressive disclosure | ALIGNED | Shows only what's needed for the specific document being generated |
| Smart defaults | ALIGNED | Auto-detection of missing fields is correct behavior |
| Educational through use | ALIGNED | Implicitly teaches Marie what each document requires |
| Peace of mind | ALIGNED | Prevents generating legally non-compliant documents silently |

**Magic wand test**: Marie would want the app to pre-fill what it can automatically (e.g., if trainer is assigned at the formation level, pre-populate the convention's trainer field). The checklist should also tell Marie *what* to type, not just *where* to go.

---

## Qualiopi Assessment — Indicators Touched by T-13

| Document type | Qualiopi indicator | Quest | Blocking rule required |
|---|---|---|---|
| Convention de formation | Ind. 6 (contractualisation) | Q05 | Client (personne morale), dates, durée, prix, objectifs |
| Contrat de formation (B2C) | Ind. 6 | Q05 | Client (personne physique), délai rétractation 10j |
| Feuille d'émargement | Ind. 11, 17, 30 (transversal) | Q11 | Séance with date + trainer + enrolled learners |
| Devis | Ind. 1 | Q04 | Client, title, dates, durée, prix |
| Convocation | Ind. 9 | Q08 | Learner email, dates, lieu confirmed |
| Certificat de réalisation | Transversal | Q17 | All émargements signed (Q11 complete) |
| Attestation de fin de formation | Ind. 11 | Q18 | Évaluation acquis (Q16b) complete |

**Compliance alignment: GAPS EXIST** — ticket only specifies 2 blocking rules and 2 warnings. The full rule set across all 7 document types is absent.

---

## Gaps & Missing Requirements

### 1. Complete blocking rule set (undefined for 5 of 7 document types)

The ticket gives 2 blocking examples. A production-ready implementation requires explicit rules for:

**Convention/Ordre de mission** — Block if:
- No client (personne morale) linked
- No formation start/end dates set
- No duration in hours defined
- No price/amount specified
- Trainer not assigned (Q09c)

**Devis** — Block if:
- No client linked
- No price/amount defined
- No formation dates

**Convocation** — Block if:
- No learner email address (can't send)
- Formation start date not confirmed
- No location or meeting link

**Certificat de réalisation** — Block if:
- Not all émargements collected (legally required per art. R.6332-26)
- Learner identity incomplete

**Attestation de fin de formation** — Block if:
- No évaluation des acquis (Q16b) result on record

### 2. Missing: Return-to-generation flow after fixing

After Marie clicks "[Compléter →]", fills the missing field, and returns — **what happens?** This is the most critical missing UX flow:
- Does the checklist auto-refresh? (requires reactive state)
- Does she need to navigate back and click Generate again?
- Should there be a "Retourner à la génération →" button on the completion tab?
- A toast on return: "Données complétées — vous pouvez générer votre [document]" would solve this elegantly.

### 3. Document dependency sequencing (Qualiopi compliance gap)

Certain documents have hard legal ordering dependencies that must be enforced:
- **Convention** requires devis accepté (Q05 depends on Q04 accepted) — Qualiopi ind. 6
- **Convocation** requires convention signée (Q08 depends on Q05) — Qualiopi ind. 9
- **Certificat de réalisation** requires all émargements signed (Q17 depends on Q11 complete)
- **Attestation** requires évaluation des acquis complete (Q18 depends on Q16b)

These are not "missing field" validations — they are **quest-state** blockers. The pre-flight checklist must distinguish between "missing data" (fill a field) and "prerequisite not met" (complete another quest first). The fix path differs: not "[Compléter →]" to a field, but "[Valider le devis →]" to a quest action.

### 4. B2C contrat de formation — special validation

When the client is a **particulier** (B2C), the contrat de formation (not convention) has specific rules:
- 10-day droit de rétractation — generating the contract triggers this window
- The checklist should warn if Marie is generating the contrat fewer than 10 days before the start date ("Attention : délai de rétractation de 10 jours — formation dans 8 jours")
- This is a legal compliance requirement (art. L.6353-5)

### 5. OPCO-specific validations

NDA number (numéro de prise en charge) is listed as a "warning" — but:
- For OPCO-financed formations with subrogation, the NDA number must appear on the **facture** and **certificat de réalisation** for OPCO payment
- Missing NDA on those documents = OPCO may reject payment
- Recommend: warn for devis/convention, **block for certificat/facture** if OPCO financing detected

### 6. Per-learner validation for batch generation (T-14 interface)

For émargements, convocations, certificats (per-learner documents):
- What if 10 of 12 learners are ready but 2 have missing email?
- The checklist should support **partial generation**: "10/12 prêts — générer pour 10, voir les 2 incomplets"
- This requires the checklist to show per-learner status, not just a global "missing data" flag
- Connects to T-14 batch logic — coordinate the validation model now

### 7. Audit trail for warning overrides (Qualiopi ind. 32)

When Marie generates a document despite warnings, this decision should be logged in `formation_audit_log`:
- `event: 'generation_with_warnings'`
- `metadata: { document_type, warnings_overridden: [...] }`
- Qualiopi ind. 32 (amélioration continue) values traceability of decisions
- Currently not mentioned in the ticket or decision doc §6

### 8. Accessibility requirements (unspecified in ticket)

- Green check / red X rely on **color alone** → add icons + explicit text labels (WCAG 1.4.1)
- "[Compléter →]" links must have **descriptive accessible names** ("Compléter le nom du client de la convention") not just "Compléter →"
- Focus management: clicking the link should move focus to the **specific missing field**, not just scroll the page
- Screen reader should announce the blocking state before the "Générer" button is disabled

### 9. "First-use" state — new formation with no data

A brand-new formation would show the checklist as mostly red. This maximally violates the "Reward completion" principle.
- **Recommendation**: Show the checklist only when Marie explicitly clicks "Générer" — not proactively in the tab
- Alternatively: Show a simpler "Cette formation n'est pas encore prête pour la génération — [Voir les étapes]" and only expand to the full checklist on request

---

## Tensions

| Tension | Description | Recommendation |
|---------|-------------|----------------|
| Completeness vs. overwhelm | Showing all 6+ validation items on a new formation violates progressive disclosure | Show only items relevant to the **specific document type** being generated, not all possible issues |
| Compliance vs. framing | Red X is necessary for compliance clarity but punishes users | Use "À compléter" framing with progress indicator: "3 sur 5 éléments prêts" |
| Warning severity | NDA warning for devis ≠ NDA warning for certificat (different legal weight) | Context-sensitive severity: same field can be warning OR block depending on document type |
| Navigation return | Fix paths must take Marie away from the generation flow | Design a "return to generation" affordance on the destination tab |

---

## Questions for the Design Council

1. **What is the complete blocking/warning rule set for each document type?** (Convention, Contrat B2C, Devis, Émargement, Convocation, Certificat, Attestation) — this must be fully specified before UX can design the checklist.

2. **How does Marie return to document generation after fixing a field?** Toast notification? Button on the completion page? Auto-redirect? This is the most important UX flow to solve.

3. **How does the checklist distinguish "missing field" from "prerequisite quest not met"?** These require different fix paths and different UX treatments.

4. **Should warning overrides be logged in the audit trail?** Qualiopi ind. 32 suggests yes — confirm the approach.

5. **For B2C (contrat de formation particulier), how should the 10-day rétractation window be surfaced?** This is a legal constraint the ticket doesn't mention.
