# Docgen – Template-based PDF generation

Feature for generating Qualiopi-style documents (e.g. **Convention de formation**) from templates with placeholder variables, filled with Formation-related data.

## Overview

- **User goal:** As an administrative secretary, generate a PDF (preview in-app, download) from a template whose variables are filled with data from the current Formation (and related client/organisme).
- **Current scope:** Test page and one document type (Convention de formation), using **dummy data**. No Supabase Storage is used; PDFs are generated on demand in memory.

## Documentation

| Document | Description |
|----------|-------------|
| [How it works](./how-it-works.md) | End-to-end flow, template format, routes, and code structure |
| [Tech stack](./tech-stack.md) | Libraries (jspdf), SvelteKit usage, and design choices |
| [Next steps](./next-steps.md) | Integration into Formation page, real data, more document types |

## Quick start

1. **Test page (logged-in app):** open `/test/docgen`.
2. **Preview:** PDF is shown in the page iframe; use “Ouvrir dans un nouvel onglet” to open it in a new tab.
3. **Download:** “Télécharger le PDF” returns the same PDF with `Content-Disposition: attachment`.
4. **API:** `GET /test/docgen/convention` returns the PDF; `GET /test/docgen/convention?download=1` forces download.

## Code locations

- **Lib:** `src/lib/docgen/` — types, template, dummy data, PDF build, public API.
- **Test route:** `src/routes/(app)/test/docgen/` — page and convention endpoint.
- **Branch:** `feat/docgen` (to be merged into `develop` when ready).
