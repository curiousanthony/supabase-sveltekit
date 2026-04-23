---
name: Team Orchestration Docs FR
overview: "Produce two French Markdown documents: one visual/diagrammatic overview of the team orchestration system for non-technical readers, and one practical step-by-step guide to reproduce the workflow — general enough to apply beyond software (marketing, ops, design)."
todos:
  - id: doc1
    content: Create docs/team-orchestration-visuelle.md — visual French overview with 7 small mermaid diagrams
    status: completed
  - id: doc2
    content: Create docs/team-orchestration-guide-pratique.md — step-by-step French recipe guide with key concept diagrams and marketing examples
    status: completed
isProject: false
---

# Plan: Two French Markdown Documents

## Document 1 — `docs/team-orchestration-visuelle.md`
**Audience**: Non-technical team member. Goal: understand the big picture fast.
**Tone**: Simple, minimal words, maximum visuals.

### Structure (8 small diagrams, no giant ones)

1. **L'idée en une phrase** — 1 human + 1 orchestrator + N agents = a full team. L'humain parle, l'équipe agit.
2. **Diagram: Vue d'ensemble** — mermaid graph: Human → Orchestrateur → 10 agents with their emoji/role labels
3. **Diagram: Le cycle de vie d'un ticket** — linear flowchart phases 0 → 1 → 1b → 2 → 3 → 4 → 5 → 6 → 7 → 7b with one-line labels, colored by Plan mode (blue) vs Agent mode (green)
4. **Diagram: Qui fait quoi** — mermaid table/graph mapping each phase to its agent(s), showing parallel vs sequential
5. **Diagram: Recettes par type de tâche** — decision tree: feature / bug UI / bug backend / tech-debt / sécurité / docs → their phase lists
6. **Diagram: Plan mode vs Agent mode** — simple split showing which phases are "réflexion/validation" (Plan mode, human confirms) vs "exécution autonome" (Agent mode). Note: agents posent des questions en Plan mode via AskQuestion.
7. **Diagram: Le moteur d'auto-amélioration** — feedback loop: learnings.md → team-architect → updated agent definitions → better results
8. **Diagram: Git & livraison** — commit after each phase → push → PR to `develop`

### What to keep short:
- Section intros: max 2-3 lines each
- Agent descriptions: one sentence each
- Phase descriptions: one sentence each

---

## Document 2 — `docs/team-orchestration-guide-pratique.md`
**Audience**: Anyone (teenager level). Goal: reproduce this workflow, adapt to any domain.
**Tone**: Practical recipe. No jargon. Use analogies.

### Structure

1. **C'est quoi ?** — analogy: like a restaurant kitchen with a head chef (orchestrator) and specialist cooks (agents). One manager, many specialists.
   - Mini diagram: human → orchestrateur → agents (same as doc 1 but labeled differently)

2. **Les 3 composantes** — with simple diagram:
   - Orchestrateur (la règle qui pilote)
   - Agents (les spécialistes)
   - Compétences/Skills (les outils qu'ils utilisent)

3. **Prérequis** — bullet list:
   - Cursor IDE (avec accès Agent mode)
   - Claude API access (Anthropic) — ou Max plan Cursor
   - Un projet git (même vide)
   - Aucune compétence en programmation requise pour démarrer
   - Budget tokens (estimation fournie plus loin)
   - Mindset : on parle à Cursor comme à un consultant, on ne code rien soi-même

4. **La recette : 5 étapes pour créer votre équipe**
   - Étape 1: Définir vos rôles — EN CONVERSATION avec Cursor, jamais dans un fichier directement. Exemple: "J'ai besoin d'une équipe marketing, quels agents me conseillerais-tu ?"
   - Étape 2: Générer vos agents — l'agent Cursor écrit les fichiers `.cursor/agents/*.md` à votre place. Vous ne tapez rien dans ces fichiers.
   - Étape 3: Générer l'orchestrateur — idem, l'agent écrit `.cursor/rules/orchestrator.mdc`. Vous décrivez le flux, l'agent formalise.
   - Étape 4: Valider les phases — en Plan mode, l'agent vous propose un plan interactif, vous répondez aux questions, il ajuste.
   - Étape 5: Activer et tester — lancer une première tâche, observer, corriger en conversation

   **Principe clé** : l'humain ne rédige JAMAIS le contenu des fichiers agents manuellement. Tout passe par la conversation. Les fichiers sont des artéfacts générés, pas des documents écrits.

   **L'agent pose des questions** : pour de meilleurs résultats, les agents utilisent un mécanisme de questions interactives (AskQuestion). Pour déclencher cela : décrire son contexte de façon incomplète ("je veux une équipe pour mon agence"), et l'agent demandera ce qu'il manque. Plus les réponses sont précises, plus l'agent généré sera pertinent. Toujours préférer répondre aux questions plutôt que de tout décrire d'un coup.

5. **Les phases clés à reproduire** — brief description of 0→7b as a recipe

6. **Auto-amélioration** — how team-architect + learnings.md makes the team smarter over time
   - Mini diagram: ticket → learning → team-architect → improved agents
   - Emphasis: team-architect lui aussi est généré par Cursor, pas écrit à la main

7. **Plan mode vs Agent mode — quand utiliser quoi**
   - Section dédiée avec tableau/diagramme:
     - **Plan mode** : phase de réflexion, design, décisions. L'agent PROPOSE mais ne touche à rien. Utile pour Phase 1 (Design Council), Phase 2 (Architect), décisions d'architecture, avant d'écrire quoi que ce soit. L'humain peut lire, ajuster, poser des questions avant de valider.
     - **Agent mode** : phase d'exécution. L'agent agit, écrit, commit. Utile pour Phase 3 (tests), Phase 4 (build), Phase 5 (review fixes), Phase 6 (QA), Phase 7 (docs).
     - **Règle d'or** : Plan mode = "réfléchis avec moi". Agent mode = "fais-le".
     - **Questions interactives en Plan mode** : l'agent peut poser des questions (AskQuestion) pour affiner le plan avant d'agir. C'est le moment idéal pour s'assurer que l'agent a bien compris. Si l'agent ne pose pas de questions alors que la demande est ambiguë, ajouter "pose-moi des questions si tu as besoin d'éclaircissements" dans le message.
   - Mini diagram: Plan mode flow → user validates → switch to Agent mode → execution

7. **Adapter à votre contexte** — diagram showing the same framework applied to:
   - Logiciel (ce projet)
   - Marketing ambitieux
   - Opérations
   - Design produit
   - With concrete example: startup marketing team (brief manager + content writer + SEO analyst + social media manager + email copywriter + analytics reviewer)

8. **Ce que ça coûte vraiment** — honest table:
   - Temps de setup: ~4-8h pour une équipe complète
   - Coût par session: estimation tokens Opus + Sonnet
   - Coût par rapport à une équipe humaine: massive savings
   - Complexity: medium (need Cursor familiarity)

9. **Avantages & Limites** — quick pro/con list (no table, bullet points)

10. **Pièges à éviter** — 5-7 concrete warnings:
    - Agents trop génériques → mauvais résultats (solution: demander à l'agent de vous poser des questions)
    - Écrire les fichiers agents manuellement → perte de temps et incohérences (solution: tout en conversation)
    - Ne pas utiliser Plan mode avant d'agir → décisions irréversibles prises trop vite
    - Oublier le QA gate → bugs en prod
    - Pas de learnings → pas d'amélioration
    - Prompts sans contexte → agents perdus (solution: décrire son contexte en début de conversation)
    - Sauter les questions de l'agent → résultats hors-sujet (solution: répondre complètement à chaque question)

11. **Modèles à utiliser** — fast/cheap vs powerful/expensive per phase

---

## Output file locations
- `docs/agent-team/team-orchestration-visuelle.md`
- `docs/agent-team/team-orchestration-guide-pratique.md`

The `docs/agent-team/` folder is the dedicated home for all documentation related to the AI agent team: orchestration, agent definitions, guides, and onboarding. Kept separate from project docs (`docs/project/`), design artifacts (`docs/team-artifacts/`), and plans (`docs/plans/`).

## Key decisions
- All content in French
- Mermaid for all diagrams (renders in GitHub/Cursor)
- Audience calibration: teenager who has never used Cursor (for doc 2) vs. non-tech team member (for doc 1)
- Doc 1: more diagrams, less text
- Doc 2: more text + key concept diagrams
- Marketing examples: real and concrete (not abstract)
- Cost section: honest numbers, ranges, not hype
- **Core philosophy throughout both docs**: the human NEVER writes agent files or orchestrator files by hand. Everything is generated via Cursor conversations. This must be crystal clear and repeated where relevant.
- **Plan mode vs Agent mode**: explicitly explained with a dedicated section in doc 2, and referenced in doc 1's phase diagram. Plan mode = think together before acting. Agent mode = execute.
- **Interactive Q&A emphasis**: both docs mention that agents ask questions (AskQuestion) to sharpen results. Human should know to trigger this by describing context incompletely, and to answer fully. Phrase to use: "pose-moi des questions si nécessaire".
- Section renumbering for doc 2: the new Plan mode section is #6, auto-amélioration becomes #7, adapter au contexte #8, coûts #9, avantages/limites #10, pièges #11, modèles #12
