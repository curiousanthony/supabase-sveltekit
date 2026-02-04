# How Docgen works

## End-to-end flow

1. **Template** – A text template (e.g. Convention de formation) contains placeholders like `{formation_title}`, `{client_address}`.
2. **Data** – A `FormationDocData` object provides values for each placeholder (for now: dummy data; later: from Formation + Client + Workspace).
3. **Replace** – `replacePlaceholders(template, data)` substitutes every `{key}` with `data[key]` (or leaves `{key}` if missing).
4. **PDF** – `buildConventionPdf(data)` runs replacement, then uses **jspdf** to render the filled text on an A4 PDF (margins, line wrap, title styling).
5. **Serve** – The convention endpoint generates the PDF in memory and returns it as `application/pdf` (no storage).

## Template format

- Placeholders: `{variable_name}` (regex: `\{(\w+)\}`).
- Template is a single string (e.g. `CONVENTION_TEMPLATE` in `convention-template.ts`).
- Supported variables are listed in `FormationDocData` and in `CONVENTION_PLACEHOLDERS`.

Example snippet:

```text
« {formation_title} »
- Durée : {formation_duration}
- Modalité : {formation_modality}
{client_name}
Adresse : {client_address}
```

## Routes and entry points

| Route / API | Purpose |
|-------------|---------|
| `GET /test/docgen` | Test page: preview iframe, “Open in new tab”, “Download”, and list of dummy variables. |
| `GET /test/docgen/convention` | Returns the Convention PDF (inline). |
| `GET /test/docgen/convention?download=1` | Same PDF with `Content-Disposition: attachment`. |

The page load function in `+page.server.ts` provides `formationDocData` (dummy) and `header` for the layout.

## Code structure

```
src/lib/docgen/
  index.ts              # Public API (buildConventionPdf, replacePlaceholders, types, template, dummy data)
  types.ts              # FormationDocData interface
  convention-template.ts # CONVENTION_TEMPLATE string + CONVENTION_PLACEHOLDERS
  dummy-data.ts         # dummyFormationDocData for testing
  pdf.ts                # replacePlaceholders(), buildConventionPdf() using jspdf

src/routes/(app)/test/docgen/
  +page.server.ts       # Loads dummy data + header
  +page.svelte          # UI: cards, iframe preview, buttons
  convention/
    +server.ts          # GET: build PDF, return Response
```

## Data shape

`FormationDocData` includes:

- **Formation:** `formation_title`, `formation_duration`, `formation_modality`, `formation_code_rncp`, `formation_financement`
- **Client:** `client_name`, `client_address`, `client_siret`, `client_email`
- **Organisme:** `organisme_name`, `organisme_legal_name`, `organisme_siret`, `organisme_address`
- **Document:** `date_signature`, `lieu`

When integrating with the app, this object is built from the Formation entity, its linked Client, and the current Workspace (organisme).
