Follow the **daily-recap** workflow in `.agent/workflows/daily-recap.md`.

Produce a **French** progress report for the **non-dev team**:

- Number of commits (livraisons) and lines of code added/removed for the day on `main`
- Features implemented and bugs fixed, in plain language
- What the changes mean for **end users**

Use **today’s date** unless the user asks for another day (e.g. "hier", "recap du 1er février").

If `SLACK_WEBHOOK_URL` is set in `.env`, post the final report to that Slack channel after showing it in the chat.
