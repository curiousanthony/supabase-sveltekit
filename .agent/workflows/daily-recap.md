---
description: Generate a daily progress recap in French for the non-dev team (commits, lines of code, features, fixes, end-user impact). Optionally post to Slack.
---

**Scope**: Commits that are **on the `main` branch** and dated for the day in question (not all branches). Use the repository root as working directory.

1. **Determine the date**
   - By default use **today** in the user's local date (from user_info / context).
   - If the user asks for another day (e.g. "hier", "recap du 1er février"), use that date instead.

2. **Gather stats from git** (run from repo root)
   - Commit count for that day on `main`:
     ```bash
     git log main --since="YYYY-MM-DD 00:00:00" --until="YYYY-MM-DD+1 00:00:00" --oneline | wc -l
     ```
   - Lines added/removed for that day:
     ```bash
     git log main --since="YYYY-MM-DD 00:00:00" --until="YYYY-MM-DD+1 00:00:00" --numstat --pretty=format:""
     ```
     Sum the first column (additions) and second column (deletions). If needed:
     ```bash
     git log main --since="..." --until="..." --numstat --pretty=format:"" | awk '{ add += $1; del += $2 } END { print add, del }'
     ```
   - List of commit messages for that day (to infer features/fixes):
     ```bash
     git log main --since="..." --until="..." --oneline
     ```

3. **Interpret commits**
   - From the commit list, identify:
     - **feat** / new functionality (nouvelles fonctionnalités)
     - **fix** (corrections de bugs)
     - **refactor** / **chore** / **docs** (améliorations techniques, doc) — mention briefly if relevant for the team
   - Use the message text to describe each in simple terms.

4. **Write the report in French**
   - **Audience**: non-developers (équipe métier, produit, etc.).
   - **Tone**: human, concise, celebratory when there’s a lot of progress. No jargon (or explain briefly: e.g. "livraisons" instead of "commits").
   - **Structure**:
     1. Short intro (e.g. "Petit point sur ma journée du [date].")
     2. **Chiffres du jour**: number of "livraisons" (commits), lines added (and optionally net change). Keep it simple.
     3. **Ce qui a été livré**: bullet list of features and fixes, in plain language.
     4. **Pour les utilisateurs finaux**: 2–4 short bullets explaining what this means in practice (easier onboarding, new settings, fewer errors, etc.).
     5. Optional closing line (e.g. "Si vous voulez qu’on détaille un point en réunion, on peut.")
   - Output the full report as a single block so it can be copied or sent as-is.

5. **Deliver the report**
   - Show the full French report in your reply.
   - Say they can copy it into their Slack channel, or use the optional Slack step below.

5b. **Optional — Post recap as a comment on a ticket page (Notion)**

- If the user asks to add this recap to the Notion page of a ticket (Suivi de projet), **do not** add it to the page body/content. Instead, add it as a **comment** on the ticket page:
  - Use the skill `suivi-de-projet`, **Workflow 7 — Ajouter un récap à un ticket (en commentaire)**.
  - Use `notion-create-comment` on the ticket page with: (1) a clear prefix that it is the agent leaving a recap (e.g. « 🤖 Récap de l'agent : »), (2) a mention of Anthony (user id in suivi-de-projet reference.md), (3) the recap text in French.
  - Confirm with the user before creating the comment if not already clear from context.

**Reminder**: All output for the team (the report) must be **in French**.
