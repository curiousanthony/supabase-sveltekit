# Docgen – Next steps

## 1. Integrate into the Formation page

- **Where:** Formation detail page (e.g. `formations/[id]`) or a “Documents” tab on that page.
- **What:** Add an action (e.g. “Générer la convention”) that builds `FormationDocData` from the current formation, its client, and the workspace (organisme), then either:
  - calls `buildConventionPdf(data)` in a server action and returns the PDF, or
  - redirects/navigates to an endpoint that accepts formation (or session) context and returns the PDF.
- **Data mapping:** From Drizzle/DB: formation name → `formation_title`, `duree` → `formation_duration`, `modalite` → `formation_modality`, etc.; client and workspace for address, SIRET, legal name; current date for `date_signature`, workspace city or config for `lieu`.

## 2. Use real Formation + Client + Workspace data

- **FormationDocData builder:** Add a function (e.g. in `$lib/docgen`) that takes a formation ID (or loaded formation + client + workspace) and returns `FormationDocData`, with null-safe formatting (dates, durations, optional RNCP/financement).
- **Permissions:** Ensure only allowed roles (e.g. secretary, admin) can trigger generation; the convention endpoint may need to accept a formation ID and resolve it server-side with auth.

## 3. More document types (Contrats, etc.)

- **Templates:** Add new template strings (and optional placeholder lists) for other Qualiopi documents (e.g. “Contrat de formation”).
- **Endpoints or actions:** One endpoint per document type, or one parameterized endpoint (e.g. `?type=convention|contrat`) that selects template and builds the same way.
- **Shared:** Keep using `replacePlaceholders()` and the same `FormationDocData` (or an extended type) where the fields overlap; add extra fields if a document needs more variables.

## 4. Optional: Word/PDF as template source

- **Current:** Template is a string in code; output is PDF via jspdf.
- **Future:** If you need to start from existing Word or PDF templates with placeholders (e.g. `{formation_title}` in the file), you would add a step to read and replace in those formats (e.g. docx with a library, or PDF form fields) and optionally still use jspdf for simple text-only generation. The current string-based template and `FormationDocData` contract can stay as the data layer.

## 5. Optional: Store generated PDFs

- If you want to keep a copy in Supabase Storage: after `buildConventionPdf(data)`, upload the buffer to a bucket (e.g. per-workspace or per-formation), then optionally link that file in the UI or in a “Documents” list. The current feature does not require this.

## 6. Test page

- The `/test/docgen` page can remain as a dev/QA tool for testing new templates or data shapes, or be restricted (e.g. only in development or for admins) once the main flow lives on the Formation page.
