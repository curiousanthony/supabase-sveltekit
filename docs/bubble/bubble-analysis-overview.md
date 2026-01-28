# Bubble Application Analysis - Overview

## Application Information

- **URL**: https://app.mentore.fr/version-test/admin?tab=besoins%20OF
- **Platform**: Bubble.io
- **Analysis Date**: 2026-01-28
- **Focus Area**: Besoins OF (Formations Management)

## Application Structure

### Login Page

**URL**: `https://app.mentore.fr/version-test/`
**Title**: Connexion

**Form Elements**:

- Email textbox (active field)
- Password textbox (Mot de passe)
- "Se rappeler de moi" (Remember me) checkbox
- "Mot de passe oublié ?" (Forgot password?) button
- "Se connecter" (Login) button
- "Pas de compte ? S'inscrire" (No account? Sign up) link

**Note**: User must log in before accessing admin portal. After login, navigation will proceed to admin portal.

### Main Navigation

**Sidebar Structure**:

**APP DATA Section**:

- KPI
- Utilisateurs (Users)
- Besoins Entreprises (Company Needs)
- **Besoins OF** (OF Needs) - Current focus
- Formateurs (Instructors)
- Clients
- Emargements (Attendance sheets)
- Messagerie (Messaging) - Shows notification badge
- Audits
- Questionnaires
- Brouillons (Drafts)
- Planning
- Facturation (Billing)
- Génération doc (Document generation)

**SETUP Section**:

- Branding
- Pages
- Header / Footer
- Emails
- Settings

### Admin Portal Layout

_[To be filled in - Document the overall layout of the admin portal, sidebar structure, header, and main content areas]_

### Key Sections Identified

1. **Besoins OF Tab** - Primary focus area for formation needs management
   - List view with card grid layout
   - Filter by client/workspace
   - Tabs: Profils à proposer, En attente d'acceptation, Profils acceptés, Besoins archivés
   - Detail view with two tabs: Informations and Admin
   - Admin tab contains 10-step administrative workflow

2. **Other Admin Sections**:
   - Besoins Entreprises (Company Needs)
   - Formateurs (Instructors management)
   - Clients management
   - Messagerie (Messaging)
   - Planning, Facturation, etc.

## Information Architecture

### Page Hierarchy

```
Admin Portal
├── Besoins OF (Primary Focus)
│   ├── List/Index View
│   ├── Create Form
│   ├── Edit Form
│   └── Detail View
└── [Other sections to be documented]
```

### User Roles & Permissions

_[To be documented - What roles exist, what permissions each has for Besoins OF management]_

## Key Findings

### Current Implementation (SvelteKit/Drizzle)

Based on the existing codebase:

- **Formations Schema**: Already has `formations` table with fields like:
  - `name`, `description`, `duree`, `modalite`, `statut`
  - Relationships to `workspaces`, `users`, `thematiques`, `sousthematiques`
  - Status enum: `['En attente', 'En cours', 'Terminée']`
  - Modality enum: `['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']`
  - Financement type enum: `['CPF', 'OPCO', 'Inter', 'Intra']`

- **Current UI**:
  - Kanban board view with status columns
  - Multi-step creation form (3 steps: Bases, Programme, Qualiopi)
  - Formation cards with key information

### Bubble Implementation (To Be Analyzed)

_[This section will be filled in after browser access and analysis]_

## Next Steps

1. ✅ Create documentation structure
2. ⏳ Navigate to Bubble app and capture page structure
3. ⏳ Document navigation and page hierarchy
4. ⏳ Analyze Besoins OF features in detail
5. ⏳ Document user flows
6. ⏳ Analyze database schema from network requests
7. ⏳ Compare with existing Drizzle schema

## Current Status

### ✅ Completed

- Documentation structure created
- Analysis framework established
- Schema comparison framework prepared
- All documentation templates created
- Browser access confirmed and working
- Login page structure documented
- Network requests captured (API endpoints identified)

### ⏳ Pending User Login

The following analysis requires user to be logged in:

- Navigation structure analysis (after login)
- Admin portal page structure
- Besoins OF list/view analysis
- Form field analysis
- Complete user flow documentation

### API Endpoints Identified

From network requests, the following Bubble API patterns were observed:

- **Initialization**: `GET /api/1.1/init/data?location=...`
- **Search**: `POST /elasticsearch/search`
- **Multi-search**: `POST /elasticsearch/msearch`
- **Multi-get**: `POST /elasticsearch/mget`
- **Workflows**: `POST /workflow/start`
- **User**: `POST /user/hi`, `POST /user/m`
- **Bulk operations**: `POST /elasticsearch/bulk_watch`

**Note**: Bubble uses Elasticsearch for data queries, which suggests a different data access pattern than direct SQL queries. This will be important when mapping to Drizzle/Supabase queries.

## Notes

- Browser MCP server access needed for detailed analysis
- User will handle initial login, then agent navigates
- Focus on main Besoins OF features only
- Documentation templates are ready to be filled in once browser access is available
