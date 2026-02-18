# Mentore Manager Notion – Reference

## Trigger phrases

| User intent | Example phrases |
|-------------|------------------|
| Infer schema | "infer db schema", "infer schema" (+ database name/URL) |
| Review prototype | "review notion", "analyze notion" |
| Add/suggest props | "add props", "what props would you add?" (+ database name) |

## Scope (quick)

- **In**: Under page "Prototype Mentore Manager"; DBs ending with `(mm)` or `(mm biblio)`.
- **Out**: Everything else (other hierarchies, DBs without that suffix).

## Notion MCP tools (relevant)

- `notion-search` – find pages/databases (use query + filters).
- `notion-fetch` – get page or database schema (IDs, props, types).
- `notion-update-data-source` – add/rename/remove database properties.
- `notion-update-page` – edit page content or properties.
- `notion-create-pages` – create pages under a database or page.

## Notion → app schema (infer)

| Notion type | Typical app mapping |
|-------------|----------------------|
| title | Primary label / display name |
| rich_text | text / varchar |
| number | integer / numeric |
| select, multi_select | enum or lookup table |
| date | date / timestamptz |
| relation | foreign key / relation |
| checkbox | boolean |
| url, email, phone_number | matching column types |
