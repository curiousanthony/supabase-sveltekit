---
id: T-S1
title: Convention fix — participant count + pricing
status: done
priority: P1
type: bug
estimate: small
chunk: 1
blocked_by: []
plan: null
decision: null
created: 2026-04-08
assignee: null
artifacts: []
---
Fixed convention participant count (query formation_apprenants instead of contacts) and pricing (prixConvenu ?? prixPublic fallback).

## acceptance
- Convention shows correct participant count; Pricing uses prixConvenu with prixPublic fallback

## log
- 2026-04-08 implementer: Fixed participant query and pricing fallback in convention template
