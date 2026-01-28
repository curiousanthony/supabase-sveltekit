---
name: Bubble App Analysis Plan
overview: Analyze the Bubble.io SaaS application to document main features, user flows, and database structure for the "Besoins OF" (Formations) management system, creating markdown reports to guide replication in the current SvelteKit/Drizzle codebase.
todos:
  - id: navigate_initial
    content: Navigate to admin portal and capture initial page structure
    status: completed
  - id: analyze_navigation
    content: Document navigation structure and identify all Besoins OF related pages
    status: completed
  - id: analyze_list_view
    content: 'Analyze Besoins OF list/index view: filters, sorting, display format'
    status: completed
  - id: analyze_create_form
    content: 'Analyze Besoins OF creation form: fields, validation, workflow'
    status: pending
  - id: analyze_edit_form
    content: Analyze Besoins OF edit form and detail view
    status: completed
  - id: document_user_flows
    content: Document complete user flows for Besoins OF management
    status: completed
  - id: analyze_database
    content: Inspect network requests and document database structure (tables, columns, relationships)
    status: pending
  - id: compare_schemas
    content: Compare Bubble database structure with existing Drizzle schema and identify gaps
    status: pending
  - id: create_overview_doc
    content: Create docs/bubble-analysis-overview.md with application structure
    status: completed
  - id: create_features_doc
    content: Create docs/bubble-besoins-of-features.md with detailed feature documentation
    status: completed
  - id: create_flows_doc
    content: Create docs/bubble-user-flows.md with user flow documentation
    status: completed
  - id: create_schema_doc
    content: Create docs/bubble-database-schema.md with database analysis
    status: completed
  - id: create_mapping_doc
    content: Create docs/bubble-to-drizzle-mapping.md with schema comparison and recommendations
    status: completed
isProject: false
---

# Bubble App Analysis Plan

## Overview

Analyze the Bubble.io application at `https://app.mentore.fr/version-test/admin?tab=besoins%20OF` to document the "Besoins OF" (Formations management) features, user flows, and database structure. Create comprehensive markdown documentation to guide replication in the SvelteKit/Drizzle codebase.

## Analysis Scope

### 1. Application Navigation & Structure

- Navigate to the admin portal and capture the overall layout
- Document main navigation structure and menu items
- Identify all pages/sections related to "Besoins OF"
- Map the information architecture

### 2. Besoins OF (Formations) Feature Analysis

Focus areas:

- **List/Index View**: How formations are displayed, filtered, sorted
- **Create/Edit Forms**: Field structure, validation rules, workflow
- **Detail View**: What information is shown, actions available
- **Status Management**: How formation statuses are managed (En attente, En cours, Terminée)
- **Relationships**: How formations connect to clients, modules, themes, etc.

### 3. User Flows Documentation

Document complete user journeys:

- Creating a new Besoin OF
- Editing an existing Besoin OF
- Viewing Besoins OF list
- Filtering/searching Besoins OF
- Status transitions
- Any approval or workflow processes

### 4. Database Schema Analysis

Identify main database tables and structure:

- **Besoins OF table**: Columns, data types, constraints
- **Related tables**: Clients, Modules, Themes, Users, etc.
- **Relationships**: Foreign keys, many-to-many relationships
- **Enums/Options**: Status values, types, categories
- **Comparison**: Map to existing Drizzle schema in `[src/lib/db/schema.ts](src/lib/db/schema.ts)`

### 5. UI/UX Patterns

- Form layouts and field groupings
- Button placements and actions
- Modal/dialog patterns
- Data display formats (tables, cards, lists)
- Filter/search interfaces

## Deliverables

### Markdown Reports (to be created in `docs/bubble` directory)

1. `**docs/bubble/bubble-analysis-overview.md**`: High-level application structure and navigation
2. `**docs/bubble/bubble-besoins-of-features.md**`: Detailed feature documentation for Besoins OF management
3. `**docs/bubble/bubble-user-flows.md**`: Step-by-step user flow documentation with screenshots/descriptions
4. `**docs/bubble/bubble-database-schema.md**`: Database tables, columns, relationships, and comparison with current schema
5. `**docs/bubble/bubble-to-drizzle-mapping.md**`: Mapping document showing how Bubble schema maps to Drizzle schema, with gaps and recommendations

## Analysis Methodology

1. **Initial Navigation**: Navigate to the admin portal and take accessibility snapshots
2. **Systematic Exploration**: Navigate through each relevant page/section
3. **Form Analysis**: Fill out forms (in test mode) to understand field requirements
4. **Data Inspection**: Use browser tools to inspect network requests and understand API structure
5. **Documentation**: Create structured markdown files with findings

## Technical Approach

- Use `browser_navigate` to access the application
- Use `browser_snapshot` to capture page structure and elements
- Use `browser_network_requests` to understand data structures
- Use `browser_take_screenshot` for visual documentation (if needed)
- Document findings in structured markdown files

## Notes

- User will handle initial login, then agent navigates
- Focus on main features only (not all pages)
- Prioritize Besoins OF management features
- Compare findings with existing schema in `[src/lib/db/schema.ts](src/lib/db/schema.ts)`
- Identify gaps between Bubble implementation and current Drizzle schema
