# Formation Admin – Marie's Experience Report & Solutions

## Overview

This document captures the real-life experience of Marie (secrétaire administrative) when using the Formation detail page, along with validated solutions for each pain point. It complements [formation-admin-ux.md](./formation-admin-ux.md).

---

## Marie's Experience Report

### Morning Scenario (8:30 AM)

Marie arrives at work and opens a Formation page to process today's tasks.

#### First impression
> "I see 'Formation pilot' and 'En cours' but... where do I start? I need to quickly see what I should do RIGHT NOW. Let me scroll... let me click around..."

#### Looking for context
> "The header says 'Formation pilot, En cours, OPCO, Acme SA' but I click 'Détails' and only get basic info. Where are the client's specific needs? What was the brief from the salesperson? What prerequisites did we promise? I need to call Acme SA but I can't even click on their name to see contact info..."

#### Trying to work on steps
> "I see 'Convocation' is highlighted but I had to scroll to understand WHY step 4 is active. There's no summary telling me 'Your next action: Send convocations to 4 learners'. I want a BIG button at the top that says 'Continue where you left off'."

#### Looking for Formateurs
> "Wait, there's a tiny 'Formateurs (3)' button at the bottom left corner. This is the MOST important thing for finding instructors! Why is it hidden? And when I open it, the instructor info is so basic – just 'Formateur A, B, C' – no specialties, no availability, no match score..."

#### Checking step names
> "Half the step names are cut off! 'Vérifications des inform...' – inform what?! I shouldn't have to hover to know what a step is called. This is a wide screen!"

---

## Issues & Solutions

### 1. Truncated Step Names

**Problem:** Step names like "Vérifications des inform..." are truncated even on wide screens.

**Solution:**
- Widen sidebar to ~300px (`w-[300px]`)
- Allow step labels to wrap to 2 lines (`whitespace-normal` or `line-clamp-2`)
- Avoid `truncate` on step labels; use `break-words` instead

---

### 2. No "At a Glance" / Continue Button

**Problem:** Marie must hunt for what to do next.

**Solution:** Add a "Hero Action Card" at the top of the content area, always visible above the fold:

```
┌────────────────────────────────────────────────────────────────┐
│ 🎯 Prochaine action                                            │
│ ───────────────────────────────────────────────────────────────│
│ Étape 4/10 : Convocation                                       │
│ Envoyez les convocations aux 4 apprenants inscrits             │
│                                                                 │
│ ⚠️ 1 apprenant sans email                                       │
│                                                                 │
│         [ Générer et envoyer les convocations ]                │
└────────────────────────────────────────────────────────────────┘
```

**Implementation:**
- Card appears when there is a current step (in_progress)
- Shows step title, description, and blockers (e.g. missing email)
- One prominent CTA button that scrolls/focuses the step content or triggers the action
- Styled distinctly (border, accent background) so it's unmissable

---

### 3. Missing Formation Details

**Problem:** Details panel only shows Client, Dates, Duration, Location, Format, Thématique, Apprenants. Missing from creation flow:
- Public cible (target audience)
- Prérequis (prerequisites)
- Objectifs pédagogiques (learning objectives)
- Mode d'évaluation (evaluation method)
- Suivi de l'assiduité (attendance tracking)
- Modules breakdown
- Client's original needs/brief

**Solution:** Restructure the Details panel into sections:

```
▾ Informations de base
  Dates, durée, lieu, format, thématique, apprenants

▾ Exigences Qualiopi
  Public cible, Prérequis, Objectifs, Mode d'évaluation, Suivi assiduité

▾ Modules
  Liste des modules avec titre, durée, objectifs

▾ Brief client
  Analyse des besoins, notes commercial, demandes spécifiques
```

---

### 4. Non-Interactive Client Name

**Problem:** "Acme SA" appears as plain greyed-out text.

**Solution:**
- Render client name as a link to `/contacts/clients/[id]`
- Add rich tooltip on hover:
  - Contact person
  - Phone / email
  - Address
  - Nombre de formations précédentes
  - Info OPCO si pertinent

---

### 5. Duplicate Title/Status

**Problem:** "Formation pilot" appears in browser tab, site header breadcrumb, and page header. "En cours" appears multiple times.

**Solution:**
- Keep breadcrumb in site header: `Formations > Formation pilot`
- Remove title from page content header; keep only badges and actions (Détails, Edit)
- Title lives in the collapsible Details section when expanded
- Status badge remains once (e.g. in site header or in a compact page bar)

---

### 6. Formateurs Feature Buried

**Problem:** Core feature hidden at bottom-left of sidebar.

**Solution:** Dedicated "Équipe pédagogique" section in sidebar, above progress:

```
┌───────────────────────────┐
│ ÉTAPES QUALIOPI           │
│ [step list...]            │
│                           │
│ ÉQUIPE PÉDAGOGIQUE        │
│ ┌───────────────────────┐ │
│ │ Module 1              │ │
│ │ Non assigné           │ │
│ │ [Trouver →]           │ │
│ ├───────────────────────┤ │
│ │ Module 2              │ │
│ │ Jean Dupont           │ │
│ │ [Voir profil]         │ │
│ └───────────────────────┘ │
│                           │
│ 3/10 étapes • 30%         │
└───────────────────────────┘
```

Plus a prominent card in content area when modules lack formateurs:
"⚠️ 2 modules sans formateur assigné – [ Trouver ] [ Assigner ]"

---

### 7. Séances Feature Enhancement

**Problem:** Séances panel is minimal; sessions need more context.

**Solution:** Séances panel with:
- **List view** (default): chronological list of sessions
- **Calendar view**: month/week toggle
- **Per-session info:**
  - Date/time
  - Formateur
  - Modalité
  - Contenu (si renseigné)
  - Émargement (X/Y signé)
  - Lieu/salle

```
┌──────────────────────────────────────────────────────────────┐
│ Séances (5)                          [ Liste | Calendrier ]   │
│ ───────────────────────────────────────────────────────────  │
│ 📅 Lun 1 mars 2026 • 9h00 - 12h30                           │
│    Module 1 • Jean Dupont                                    │
│    Émargement: 3/4 ✓                                         │
│                                                              │
│ 📅 Lun 1 mars 2026 • 14h00 - 17h30                          │
│    Module 1 • Jean Dupont                                    │
│    Émargement: 0/4 ⏳                                         │
└──────────────────────────────────────────────────────────────┘
```

---

## Priority Order

| Priority | Issue                        | Impact                  |
|----------|------------------------------|-------------------------|
| **P0**   | Add "Next Action" hero card  | Critical for productivity |
| **P0**   | Fix truncated step names     | Usability blocker       |
| **P1**   | Enhance Details with Qualiopi fields | Compliance risk  |
| **P1**   | Elevate Formateurs visibility| Core feature buried     |
| **P2**   | Make client name interactive | Quality of life         |
| **P2**   | Remove duplicate title       | Visual clutter          |
| **P2**   | Enhance Séances with views   | Nice to have            |

---

*Last updated: February 2026*
*Based on user testing and Marie persona*
