# Docgen – Tech stack and design choices

## Libraries

### jspdf

- **Purpose:** Generate PDFs in JavaScript (client or Node).
- **Usage:** We use it **server-side** in SvelteKit (e.g. in `src/lib/docgen/pdf.ts` and in the convention `+server.ts`).
- **What we use:** `new jsPDF()`, `setFontSize`, `setFont`, `text()`, `splitTextToSize()` (line wrap), `addPage()`, `output('arraybuffer')`.
- **Output:** `doc.output('arraybuffer')` returns an `ArrayBuffer` that we pass to `new Response()` for the PDF endpoint.

No HTML/CSS is involved: the template is plain text; jspdf draws text at coordinates. That keeps the implementation simple and avoids heavy dependencies (e.g. Puppeteer).

## SvelteKit

- **Server-only:** PDF building runs in `+server.ts` and in `$lib/docgen` (imported by the server). No PDF generation in the browser for this feature.
- **Response:** The convention endpoint returns `new Response(pdfBytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': '...' } })`. No file system or Supabase Storage.
- **Test page:** Standard `+page.server.ts` (load) and `+page.svelte` (UI). Preview uses an iframe whose `src` is `/test/docgen/convention`.

## No Supabase Storage

- PDFs are generated **on demand** and streamed in the HTTP response.
- Nothing is written to Supabase Storage for this test flow, so no bucket usage or cleanup.
- If you later need to store generated PDFs (e.g. for history or attachments), you can add an optional upload step after generation; the current design does not require it.

## In-memory only

- `buildConventionPdf(data)` returns an `ArrayBuffer`.
- The endpoint reads that buffer once into the `Response` body. No temp files, no persistent storage.

## Placeholder replacement

- Simple regex: `/\{(\w+)\}/g` to find `{variable_name}`.
- Replacement: `data[key] ?? \`{${key}}\`` so missing keys stay as `{key}` in the output.
- Any template that uses the same `{key}` convention can reuse `replacePlaceholders()`; only the template string and the data shape need to match.
