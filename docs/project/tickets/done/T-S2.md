---
id: T-S2
title: 3 new PDF templates (feuille_emargement, devis, ordre_mission)
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
Implemented feuille_emargement (proof with signature timestamps), devis (HT/TVA/TTC with workspace defaults), and ordre_mission (per-formateur with TJM/costs) via pdfmake 0.3.7.

## acceptance
- All three PDF types generate successfully from the Documents tab; Templates follow correct French business document conventions

## log
- 2026-04-08 implementer: Built 3 PDF templates via pdfmake 0.3.7 CJS
