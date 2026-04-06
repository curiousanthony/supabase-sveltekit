---
name: design-brainstorm
description: >
  Launches parallel specialist subagents for design thinking and ideation before implementation.
  Includes UX reviewer (behavioral psychology), product foundation reader, Qualiopi analyst, and
  dynamic specialists based on the task. Synthesizes insights into validated design decisions.
  Use when starting a new feature, redesign, or significant UX change. Trigger phrases: "design",
  "brainstorm", "ideate", "how should we build", "what should the UX be", "feature design",
  "let's think about", "before we build". Always use before writing UI code for features the
  user hasn't reviewed yet.
---

# Design Brainstorm

Launch a team of specialist subagents to explore a feature from multiple angles before any code is written. The goal is intentional design, not generic implementation.

## When to Use

- Starting a new feature or significant enhancement
- Before writing UI code for a feature not yet reviewed
- When the user asks "how should we build X" or "what should the UX be"
- When a `.plan.md` exists but UX details haven't been validated

---

## Step 1: Analyze the Task

Before launching subagents, spend 30 seconds identifying:

1. **What feature or change** is being designed
2. **Which user flows** are affected
3. **Which Qualiopi indicators** might be impacted (check `docs/qualiopi-formation-workflow.md`)
4. **What existing UI patterns** already exist in the app for similar features

---

## Step 2: Launch Specialist Subagents in Parallel

Always launch these three as parallel Task calls:

### A. UX Senior Designer

```
subagent_type: "generalPurpose"
prompt: |
  You are a Senior UI/UX Designer for Mentore Manager.
  Read .cursor/skills/ux-reviewer/SKILL.md and its references/ directory.
  
  Feature being designed: [DESCRIPTION]
  Current implementation (if any): [FILE PATHS]
  
  Apply behavioral psychology principles (Hick's Law, Fitts's Law, cognitive load,
  peak-end rule, Zeigarnik effect) to evaluate or propose the UX for this feature.
  
  The primary user is Marie, 34, administrative manager at a French training organization.
  She manages 10-20 formations simultaneously, is often interrupted, and lives with
  latent audit anxiety. She needs to feel guided, confident, and in control.
  
  Return:
  1. UX recommendations grounded in specific psychological principles
  2. Friction points to avoid (with severity: critical/major/minor)
  3. Proposed interaction patterns with rationale
  4. Questions for the developer if intent is unclear
```

### B. Product Foundation Reader

```
subagent_type: "explore"
prompt: |
  Read docs/foundations/mentore-manager-formations-ux-foundation.md carefully.
  
  Feature being designed: [DESCRIPTION]
  
  Evaluate this feature against EVERY principle in the foundation:
  - Status-first (not data-first)
  - Proactive intelligence (not passive display)
  - Context-appropriate urgency
  - Reward completion (don't punish incompletion)
  - Progressive disclosure
  - Smart defaults, zero configuration
  - Educational through use
  - Peace of mind as primary goal
  
  For each principle, state: ALIGNED / NEEDS WORK / NOT APPLICABLE + one sentence.
  Flag any violation of the "magic wand test" or "competitor fear test".
```

### C. Qualiopi Analyst

```
subagent_type: "generalPurpose"
prompt: |
  You are a Qualiopi compliance analyst for Mentore Manager.
  Read docs/qualiopi-formation-workflow.md carefully.
  
  Feature being designed: [DESCRIPTION]
  
  1. Which Qualiopi indicators (from the 32 criteria) does this feature help satisfy?
  2. Are there compliance requirements this feature MUST meet that aren't yet covered?
  3. Could any proposed UX shortcut create a compliance gap?
  4. What evidence/documents should this feature help Marie produce or track?
  5. Rate compliance alignment: STRONG / ADEQUATE / GAPS EXIST
  
  Be specific -- cite indicator numbers and quest IDs (Q01-Q25).
  Work WITH the UX recommendations, not against them. The goal is compliance
  that feels invisible, not compliance that creates friction.
```

### D. Dynamic Specialists (add based on task)

If the task involves:
- **Database changes** -> add a Schema Analyst (explore `src/lib/db/schema/`)
- **New components** -> add a Component Inventory Explorer (explore `src/lib/components/`)
- **Email/notifications** -> add a Communication Patterns Explorer
- **Calendar/scheduling** -> add a Temporal UX Specialist

---

## Step 3: Synthesize

After all subagents return:

1. **Identify consensus**: Where do all specialists agree?
2. **Surface tensions**: Where do UX and compliance pull in different directions?
3. **Prioritize**: Use the foundation's priority hierarchy: Reduce anxiety > Provide clarity > Enable action > Celebrate progress > Provide detail
4. **Formulate decisions**: Write clear, numbered design decisions

---

## Step 4: Validate with User

Present the synthesized design direction to the user:

1. **Summary**: 3-5 bullet points of key design decisions
2. **Tensions**: Any unresolved conflicts between specialists (let user decide)
3. **Questions**: Anything that needs user input before proceeding
4. **Qualiopi impact**: Quick compliance summary from the analyst

Use the AskQuestion tool for structured choices when there are clear options.

---

## Step 5: Record Decisions

After user validation:

1. If decisions are significant, create or update a file in `docs/decisions/` (see `project-tracker` skill for format)
2. Update the `.plan.md` if one exists
3. Proceed to implementation (read `implement-with-team` skill)
