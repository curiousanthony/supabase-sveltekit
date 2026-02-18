---
name: mentore-manager-notion
description: Uses the Notion MCP to work with the "Prototype Mentore Manager" Notion workspace. Infers database schema from Notion DB props, reviews/analyzes the prototype for MVP readiness, and suggests or adds missing database properties. Use when the user says "infer db schema", "infer schema", "review notion", "analyze notion", "add props", "what props would you add?", or references the Prototype Mentore Manager or Notion databases for the Mentore Manager app.
---

# Mentore Manager – Notion Prototype

Work with the **Prototype Mentore Manager** Notion space using the Notion MCP. All actions are scoped to that prototype; other Notion content is out of scope.

**When clarification is needed** (e.g., which database, which page, ambiguous name), ask the user in chat before proceeding. Do not guess.

---

## Scope (strict)

- **In scope**: Only content under the **"Prototype Mentore Manager"** page (by parent hierarchy). Only Notion **databases** whose title ends with:
  - **`(mm)`** – core Mentore Manager
  - **`(mm biblio)`** – Library feature (avoids name clashes)
- **Out of scope**: Any page or database that is not under "Prototype Mentore Manager", or any database that does not end with `(mm)` or `(mm biblio)`. Ignore those.

Use **Notion MCP** tools: `notion-search`, `notion-fetch`, `notion-update-data-source`, `notion-create-pages`, `notion-update-page`, etc., as needed for each workflow.

---

## 1. Infer database schema

**When**: User says "infer db schema", "infer schema", or similar, and provides or identifies a Notion database.

**Steps**:

1. **Resolve the database**
   - If the user gave a name/URL, search with `notion-search` (query type `internal`) scoped to the Prototype Mentore Manager context, or fetch by URL/ID.
   - Confirm the database title ends with `(mm)` or `(mm biblio)`. If not, tell the user it is out of scope.
2. **Fetch the database**
   - Use `notion-fetch` with the database URL or ID to get the full schema: property names, types, and options (e.g. select/multi_select options, relation targets).
3. **Infer schema for code**
   - Map Notion property types to your app’s schema (e.g. Supabase/Postgres or app types):
     - title → typically primary display / label
     - rich_text → text/varchar
     - number → integer/numeric
     - select, multi_select → enum or lookup tables
     - date → date/timestamptz
     - relation → foreign keys / relations
     - checkbox → boolean
     - url, email, phone_number → appropriate column types
   - Output a clear schema summary (tables, columns, types, relations) that can be used for migrations or type definitions. Note any ambiguities and ask the user if needed.

---

## 2. Review / analyze Notion (MVP readiness)

**When**: User says "review notion", "analyze notion", or wants a review of the prototype for the app.

**Steps**:

1. **Find the prototype root**
   - Search for "Prototype Mentore Manager" and fetch that page to confirm hierarchy and child pages/databases.
2. **List in-scope databases**
   - Identify all databases under that hierarchy whose titles end with `(mm)` or `(mm biblio)`. Fetch each to get structure.
3. **Analyze and recommend**
   - **Props**: Missing or inconsistent properties (e.g. status, dates, assignees, relations).
   - **Page names / structure**: Naming consistency, clarity, alignment with app screens/features.
   - **Databases (data sources)**: Gaps (e.g. missing entity types), redundant or duplicate concepts.
   - **Relations**: Missing relations between databases, or relation direction/meaning that should be clarified for the app.
4. **Output**
   - Short executive summary.
   - Bulleted recommendations per area (props, page names, databases, relations).
   - Goal: MVP UX is ready in Notion and the codebase stays in sync on core concepts, schema, and relations.

---

## 3. Add or suggest props for a database

**When**: User says "add props", "what props would you add?", or similar, and refers to a specific database (by name or context).

**Steps**:

1. **Resolve and fetch the database**
   - Identify the database (must end with `(mm)` or `(mm biblio)` and be under Prototype Mentore Manager). Fetch it with `notion-fetch` to get current properties and types.
2. **Analyze context**
   - Consider the database’s role in the app (e.g. courses, members, library items), what the system needs (e.g. status, dates, ownership), and what the user should see in the finished app.
3. **Suggest missing props**
   - List current props, then suggest new ones with:
     - Property name
     - Notion type (select, date, relation, etc.)
     - Brief reason (system need vs user need).
   - If the user asked to **add** props, use `notion-update-data-source` to add properties; confirm with the user before applying changes. If the user asked what you **would** add, output recommendations only and offer to apply after validation.
4. **Validate with the user**
   - Summarize changes or suggestions and ask for confirmation before creating or updating properties in Notion.

---

## Additional resources

- Trigger phrases, scope summary, and Notion→app type mapping: [reference.md](reference.md)
