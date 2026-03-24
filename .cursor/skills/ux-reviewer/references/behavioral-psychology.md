# Behavioral Psychology Reference — UX Reviewer Skill

A quick-reference index of psychological principles with SaaS-specific examples.
Read this file when justifying a finding that requires deeper psychological grounding.

---

## Table of Contents
1. Cognitive Load Theory
2. Hick's Law
3. Fitts's Law
4. Peak-End Rule
5. Zeigarnik Effect
6. Loss Aversion
7. Status Quo Bias
8. Progressive Disclosure
9. Affordance Theory
10. Emotional Contagion in UI

---

## 1. Cognitive Load Theory (Sweller, 1988)

Working memory can hold approximately 4 chunks of information simultaneously. Beyond this, users make errors, skip steps, or abandon tasks.

**In SaaS compliance tools**: A page showing 6 statuses, 3 alerts, 2 progress bars, and a notification dot is already at cognitive limit before the user reads a single word.

**Design implications**:
- Ruthlessly reduce simultaneous information. If a user must act on ONE thing, show them one thing.
- Use progressive disclosure: reveal details only when the user requests them (expand/collapse, modals, sidebars).
- Extraneous load (decorative elements, redundant labels, unsolicited information) is the enemy.

**When to cite this**: Screens with 5+ competing visual elements, dashboards, overview pages.

---

## 2. Hick's Law (Hick & Hyman, 1952)

Decision time increases logarithmically with the number of choices. Doubling options doesn't double time — it's worse.

**In SaaS**: Navigation with 7 tabs is significantly harder than 4 tabs. A quest card with 5 possible actions creates measurable hesitation.

**Design implications**:
- Reduce visible options. Collapse secondary actions into menus.
- Default selections reduce choices to 0 in the common case.
- Primary actions should be pre-selected / highlighted to eliminate the "which one?" moment.

**When to cite this**: Navigation, action menus, status filters, any screen with multiple CTAs.

---

## 3. Fitts's Law (Fitts, 1954)

Time to acquire a target = log2(2D/W) where D = distance and W = target width. Small targets far from the current focus are hardest to hit.

**In SaaS on mobile**: A 24px action button in a table row corner, 400px from the user's thumb, will cause misclicks under stress.

**Design implications**:
- Primary CTAs: minimum 44px touch target on mobile, visually large on desktop.
- Place action buttons near the content they act on (in-context actions > toolbar actions).
- Destructive actions should be small AND distant (intentional friction).

**When to cite this**: Mobile layouts, tables with row actions, floating buttons, navigation tabs.

---

## 4. Peak-End Rule (Kahneman & Fredrickson, 1993)

Users don't remember the average of their experience — they remember the most intense moment (peak) and the final moment (end). Everything else fades.

**In compliance SaaS**: If a user discovers a blocked quest 10 minutes into their session, that's the peak. If the last thing they see is "3 documents manquants", that's the end. Both override all the pleasant interactions in between.

**Design implications**:
- Minimize peak negative moments (errors, blocks, missing data discoveries).
- Design great ending moments: what does "you've completed this quest" look like? Make it feel like a small victory.
- Audit the zero-state (first visit) and the completion state (task done) with extra care.

**When to cite this**: Error states, empty states, success states, completion flows.

---

## 5. Zeigarnik Effect (Zeigarnik, 1927)

Incomplete tasks occupy working memory more than completed ones. Humans have a psychological drive to close open loops.

**In compliance tools**: Showing "3/6 tâches complétées" creates useful tension that motivates completion. BUT showing 4 simultaneous incomplete tasks with no clear priority creates diffuse anxiety with no clear resolution path.

**Design implications**:
- Use progress indicators to make incompleteness visible — but only for tasks the user can act on NOW.
- Locked/future tasks should be visually suppressed so they don't create premature open loops.
- Always give the user a clear "next action" to resolve the open loop.

**When to cite this**: Progress bars, task lists, quest systems, multi-step forms.

---

## 6. Loss Aversion (Kahneman & Tversky, 1979)

Losses feel approximately 2x more painful than equivalent gains feel good. Fear of losing is a stronger motivator than hope of gaining.

**In compliance SaaS**: "Vous risquez un écart Qualiopi" triggers stronger action than "Complétez cette étape pour améliorer votre conformité." Both are true; one motivates more.

**Design implications**:
- Frame compliance gaps as risks to be eliminated, not scores to be improved.
- For blocked or missing items, emphasize what's at stake, not just what's incomplete.
- Don't overuse — persistent loss framing creates chronic anxiety. Reserve for genuinely urgent items.

**When to cite this**: Alert messages, blocked quest states, compliance score displays.

---

## 7. Status Quo Bias (Samuelson & Zeckhauser, 1988)

Users prefer the current state of affairs. Change requires activation energy proportional to perceived risk.

**In SaaS**: Users will tolerate a slightly confusing workflow for months rather than explore a new way of doing things — even if it's clearly better.

**Design implications**:
- New features and changes should feel familiar: reuse established patterns.
- Don't change UI patterns without clear visual signposting of what changed and why.
- Progressive disclosure respects status quo bias — show new capabilities on demand, don't force them.

**When to cite this**: Any redesign, onboarding flows, new feature introductions.

---

## 8. Progressive Disclosure (Miller, 1956 / Norman)

Show only the information and controls needed for the current task. Reveal more as the user advances.

**In SaaS**: A formation detail page shouldn't show all sub-tasks, documents, and dates simultaneously. Show the summary → let the user choose to expand → show details.

**Design implications**:
- Layer 1: Status + primary action (always visible)
- Layer 2: Progress details (on demand: expand, tab, sidebar)
- Layer 3: Full data / configuration (modal, dedicated screen)

**When to cite this**: Detail pages, complex forms, dashboards, table rows.

---

## 9. Affordance Theory (Gibson, 1977 / Norman)

Objects communicate how they should be used through their visual properties. A button that looks tappable gets tapped; a button that looks flat gets ignored.

**In modern flat UI**: Ghost buttons, minimal borders, and neutral colors often fail to signal "click me." This is especially problematic in enterprise tools where users are task-focused, not exploring.

**Design implications**:
- Primary actions: filled, high-contrast, clear label.
- Secondary actions: outlined or ghost, visually subordinate.
- Disabled states: clearly non-interactive (reduced opacity + no cursor change = confusion).
- Locked items: should communicate WHY they're locked, not just that they are.

**When to cite this**: CTA buttons, interactive vs non-interactive elements, locked/disabled states.

---

## 10. Emotional Contagion in UI (Hatfield et al., 1993)

Visual environments transfer emotional states. A stressed, cluttered, alert-heavy UI makes the user feel stressed. A calm, spacious, organized UI reduces their perceived cognitive burden.

**In compliance SaaS**: Red alerts everywhere communicate crisis. Even when there are real problems, an all-red dashboard trains users to feel anxiety on arrival — eventually causing alert fatigue and disengagement.

**Design implications**:
- Calibrate alert severity honestly. If everything is red, nothing is urgent.
- Use neutral/positive visual anchors (progress completed, validated items) to balance negative ones.
- White space is not wasted space — it communicates calm and confidence.
- Typography, color temperature, and spacing are emotional tools, not just aesthetic ones.

**When to cite this**: Overview pages, alert systems, compliance score displays, any screen where multiple problem states co-exist.
