---
id: T-S5
title: Schema migration — prixConvenu + workspace financial defaults
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
Added prixConvenu (numeric, nullable) to formations and 4 workspace defaults (tvaRate, defaultPaymentTerms, defaultDevisValidityDays, defaultCancellationTerms).

## acceptance
- prixConvenu column exists on formations; Workspace financial defaults are queryable

## log
- 2026-04-08 implementer: Migration 20260407100000_chunk1_schema_prix_convenu_workspace_defaults.sql applied
