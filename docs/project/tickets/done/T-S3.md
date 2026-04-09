---
id: T-S3
title: Email relance templates + ctaUrl
status: done
priority: P1
type: feature
estimate: small
chunk: 1
blocked_by: []
plan: null
decision: null
created: 2026-04-08
assignee: null
artifacts: []
---
Added devis_relance, convention_relance, ordre_mission_relance to EMAIL_TYPE_TO_TEMPLATE. Wired ctaUrl in sendQuestEmail.

## acceptance
- Relance email types map to correct Postmark templates; ctaUrl is passed in quest emails

## log
- 2026-04-08 implementer: Added 3 relance aliases and ctaUrl to sendQuestEmail
