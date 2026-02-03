# Formation Admin Workflow – UX Design Document

## Overview

This document outlines the UX design decisions for the Formation detail page (`/formations/[id]`), which serves as the administrative workflow interface for managing training courses and ensuring Qualiopi compliance.

---

## Design Principles

### 1. Action-First
The user should immediately know what to do next. The current step's primary action must be unmissable.

### 2. Progressive Disclosure
Show essential information first, details on demand. Don't overwhelm with data that's not immediately relevant.

### 3. Persistent Navigation
The 10-step workflow should always be visible (on desktop), so users maintain spatial awareness of where they are in the process.

### 4. Fun & Rewarding
Administrative work shouldn't feel like a chore. Micro-celebrations, encouraging copy, and visual progress create a sense of accomplishment.

---

## User Persona: Marie, Secrétaire Administrative

Marie works at a French Learning Center (Organisme de Formation). Her daily workflow involves:

- **Morning triage**: Check which formations need attention, prioritize urgent ones
- **Step processing**: Complete administrative steps (generate documents, send emails, collect signatures)
- **Exception handling**: Follow up on missing documents, incomplete learner info
- **End-of-week review**: Report on Qualiopi compliance status

### What Marie needs:
- Quick overview of all pending actions
- One-click completion for routine steps
- Clear visibility of blockers and how to fix them
- Satisfying feedback when work is done

### What Marie doesn't need:
- Seeing all formation details all the time
- Navigating through multiple pages to complete one action
- Guessing what step she's on or what's next

---

## Layout: Column-Based Structure

### Desktop (>1024px)

```
┌──────────────────────────────────────────────────────────────────┐
│ Formation pilot          En cours  OPCO  Acme SA    [▼ Détails] │
├────────────────────────┬─────────────────────────────────────────┤
│                        │                                         │
│  ÉTAPES QUALIOPI       │  ▶ Étape 4 : Convocation                │
│  ────────────────      │  ─────────────────────────────────────  │
│  ✓ Vérifications       │                                         │
│  ✓ Convention          │  Envoyez les convocations aux           │
│  ✓ Analyse besoins     │  4 apprenants inscrits.                 │
│  ▶ Convocation    ←    │                                         │
│  ○ Ordre de mission    │  ┌─────────────────────────────────┐    │
│  ○ Attestation         │  │ [Générer et envoyer]            │    │
│  ○ Questionnaires      │  └─────────────────────────────────┘    │
│  ○ Documents formateur │                                         │
│  ○ Facturation         │  Apprenants :                           │
│  ○ Dossier complet     │  ✓ Jean Dupont                          │
│                        │  ✓ Marie Martin                         │
│  ────────────────      │  ⚠ Pierre Bernard (email manquant)      │
│  3/10 • 30%            │  ✓ Sophie Dubois                        │
│                        │                                         │
│  [Formateurs 3]        │                                         │
│  [Séances 5]           │                                         │
│                        │                                         │
└────────────────────────┴─────────────────────────────────────────┘
       ~260px fixed                  remaining width
```

### Tablet (768-1024px)

Same layout, but left column can be toggled via a button in the header.

### Mobile (<768px)

```
┌─────────────────────────────────────┐
│ Formation pilot      En cours  OPCO │  ← Sticky header
├─────────────────────────────────────┤
│                                     │
│  ▶ Étape 4 : Convocation            │
│                                     │
│  [Générer et envoyer]               │  ← Full-width content
│                                     │
│  Apprenants (4)                     │
│  ...                                │
│                                     │
├─────────────────────────────────────┤
│  ════════════════════════════════   │  ← Swipe handle
│  Étape 4/10  •  Convocation  •  30% │  ← Mini status bar (tap to expand)
└─────────────────────────────────────┘
```

Bottom sheet reveals full step list when tapped or swiped up.

---

## Component Breakdown

### 1. Header Bar (Collapsible Formation Info)

**Collapsed (default):**
```
Formation pilot | En cours | OPCO | Acme SA | [▼ Détails] [Edit]
```

**Expanded:**
```
Formation pilot | En cours | OPCO | Acme SA | [▲ Masquer] [Edit]
───────────────────────────────────────────────────────────────
01 mars → 15 mars 2026  •  24h  •  Paris  •  Présentiel
Thématique: Management  •  4 apprenants inscrits
```

- Shows essential context in one line
- Full details available on demand
- Auto-collapses when user selects a step (to maximize content area)

### 2. Step Sidebar (Left Column)

**Always visible on desktop.** Contains:

1. **Step list** with visual status:
   - ✓ Green checkmark = completed
   - ▶ Highlighted/active = current step
   - ○ Gray circle = future step
   - ⚠ Warning icon = blocked/needs attention

2. **Progress indicator**:
   - "3/10 • 30%" at bottom of step list
   - Optional: small progress bar

3. **Quick access buttons**:
   - [Formateurs (3)] → opens slide-over panel
   - [Séances (5)] → opens slide-over panel
   - [Infos formation] → expands header details

### 3. Content Area (Right Column)

Content changes based on step status:

#### Completed Step (Review Mode)
```
✓ Étape 2 : Convention et programme

Complétée le 15 janvier 2026 par Marie D.

Documents générés :
• Convention_Acme_SA.pdf        [Voir] [Télécharger]
• Programme_Formation.pdf       [Voir] [Télécharger]

Signature client : ✓ Reçue le 18 janvier

[Régénérer les documents]
```

#### Current Step (Action Mode)
```
▶ Étape 4 : Convocation

Envoyez les convocations aux 4 apprenants inscrits.

┌─────────────────────────────────────────────┐
│     [Générer et envoyer les convocations]   │  ← Primary CTA, unmissable
└─────────────────────────────────────────────┘

Apprenants :
✓ Jean Dupont (jean@example.com)
✓ Marie Martin (marie@example.com)
⚠ Pierre Bernard (email manquant) [Ajouter email]
✓ Sophie Dubois (sophie@example.com)

[Programmer l'envoi pour plus tard]
```

#### Future Step (Preview Mode)
```
○ Étape 5 : Ordre de mission                À venir

Cette étape sera disponible après la convocation.

Vous aurez besoin de :
• Liste des apprenants convoqués
• Informations du formateur assigné

[Commencer quand même]  ← Optional, if workflow allows
```

### 4. Slide-Over Panels (Formateurs & Séances)

Instead of bottom drawers, use **slide-over panels from the right** on desktop:

```
                                    ┌─────────────────────────┐
┌─────────────────────────────────┐ │ Formateurs (3)      [×] │
│                                 │ │ ─────────────────────── │
│  Main content area              │ │                         │
│  (dimmed when panel open)       │ │ Par module :            │
│                                 │ │ • Module 1: Non assigné │
│                                 │ │ • Module 2: Jean Dupont │
│                                 │ │                         │
│                                 │ │ [Assigner un formateur] │
│                                 │ │                         │
└─────────────────────────────────┘ └─────────────────────────┘
```

On mobile, these become bottom sheets.

---

## Interaction Patterns

### Step Navigation
- Click any step → content area updates
- Current step is highlighted in sidebar
- Completed steps show review mode
- Future steps show preview mode

### Step Completion Flow
1. User performs action (e.g., clicks "Générer et envoyer")
2. Loading state with progress indicator
3. Success: 
   - Celebration moment (✅ animation, encouraging message)
   - Step turns green in sidebar
   - Auto-suggestion: "Prochaine étape : Ordre de mission [Continuer →]"
4. Error:
   - Clear error message with fix action
   - "Il manque l'email de Pierre Bernard. [Ajouter →]"

### Progressive Disclosure
- Formation details: collapsed by default, expandable
- Step details: show essentials, "Voir plus" for history/logs
- Error details: summarized, expandable for technical info

---

## Visual Feedback & Fun Factor

### Micro-Celebrations
- Step completed → checkmark animation, brief confetti or pulse
- Formation 100% complete → larger celebration, "Dossier Qualiopi complet ! 🎉"

### Encouraging Copy
| Instead of... | Say... |
|---------------|--------|
| "Step 4 completed" | "Bravo ! Convocations envoyées 🎉" |
| "Error: required field" | "Il manque l'email de Jean. [Ajouter →]" |
| "3/10 steps done" | "Plus que 7 étapes vers la conformité !" |
| "Loading..." | "Génération en cours..." |

### Progress Visualization
- Sidebar progress: "3/10 • 30%" with small bar
- Visual journey: steps turning green as completed
- Satisfying transitions: smooth animations when state changes

### Color Coding
- ✓ Green: completed, success
- ▶ Primary color: current, active
- ○ Gray: future, inactive
- ⚠ Amber: warning, needs attention
- 🔴 Red: error, blocker

---

## Responsive Behavior Summary

| Breakpoint | Left Sidebar | Content Area | Formateurs/Séances |
|------------|--------------|--------------|-------------------|
| Desktop (>1024px) | Always visible, fixed 260px | Remaining width | Slide-over panel from right |
| Tablet (768-1024px) | Collapsible, toggle button | Full width when sidebar hidden | Slide-over panel |
| Mobile (<768px) | Bottom sheet (swipe up) | Full width | Bottom sheet |

---

## Implementation Notes

### Phase 1: UI Mockup (Current)
- Build the column-based layout with dummy data
- Implement all three step states (completed, current, future)
- Add collapsible header
- Add slide-over panels for Formateurs/Séances
- Style with appropriate visual hierarchy

### Phase 2: Data Integration
- Connect to real formation data
- Load step completion status from database
- Implement step content for each of the 10 steps

### Phase 3: Actions & Logic
- Implement step completion actions
- Add form submissions
- Connect to document generation
- Add micro-celebrations and feedback

---

## Open Questions

1. **Step linearity**: Should steps be strictly sequential, or can users complete them in any order?
   - Recommendation: Soft ordering (recommended sequence) with warnings for dependencies

2. **Auto-advance**: After completing a step, should we auto-navigate to the next?
   - Recommendation: Show suggestion with button, don't force navigation

3. **Formateur assignment**: Should this be a separate workflow or integrated into specific steps?
   - Recommendation: Quick access via sidebar panel, detailed management in dedicated page

---

*Last updated: February 2026*
*Author: AI Assistant in collaboration with Anthony*
