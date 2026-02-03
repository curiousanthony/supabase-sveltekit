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

6. **Optional — Post to Slack**
   - If the user has set `SLACK_WEBHOOK_URL` in `.env` (or in the environment), post the same report to Slack:
     - Load the webhook URL from `.env` (do not hardcode it).
     - Send a single message with the report text. Use `curl` with a JSON body: `{"text": "<report>"}` (escape newlines as `\n` for JSON).
     - Example (run from repo root, with report in a variable or a file):
       ```bash
       # After generating the report, if SLACK_WEBHOOK_URL is set:
       source .env 2>/dev/null || true
       if [ -n "$SLACK_WEBHOOK_URL" ]; then
         # Escape report for JSON: replace " with \", newlines with \n
         curl -s -X POST -H "Content-Type: application/json" \
           -d "{\"text\": \"$(echo "$REPORT" | sed 's/\\/\\\\/g; s/"/\\"/g; s/$/\\n/g' | tr -d '\n' | sed 's/\\n$//')\"}" \
           "$SLACK_WEBHOOK_URL"
       fi
       ```
     - If `.env` is not sourceable (e.g. export KEY=val format), read `SLACK_WEBHOOK_URL` from the file and use it in `curl`. Do not echo or log the URL.
   - If `SLACK_WEBHOOK_URL` is not set, tell the user: "Pour envoyer le rapport dans Slack, ajoutez `SLACK_WEBHOOK_URL` (webhook d’un canal) dans votre fichier `.env`, puis relancez la commande."

**Reminder**: All output for the team (the report) must be **in French**.
