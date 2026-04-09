# Learnings

One-line insights discovered during development. Reviewed by team-architect every 10 entries.

- 2026-04-09 T-1: French PDF amounts need Intl currency + replace U+202F/U+00A0 so Helvetica does not garble thousands separators
- 2026-04-09 T-2: Centralize PDF_TIMEZONE in shared for every template date/time helper
- 2026-04-09 T-3: `default` + `assertNever` on DocumentType switch catches missing cases at compile time
- 2026-04-09 T-4: Typed wrapper for pdfmake CJS singleton avoids `any` on createRequire
- 2026-04-09 T-5: Certificat attendance — innerJoin seances on formationId avoids loading all contact émargements
- 2026-04-08 T-S1: Locale-aware number formatting needed for French currency (not just toFixed)
- 2026-04-08 T-S2: pdfmake CJS via createRequire works but needs setFonts() before createPdf()

## Reviewed 2026-04-08
