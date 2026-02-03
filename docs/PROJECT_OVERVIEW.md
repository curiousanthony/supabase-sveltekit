# Mentore Manager - Project Overview

## What is Mentore Manager?

**Mentore Manager** is a SaaS application designed to digitize and streamline administrative workflows for French training organizations ("Organismes de Formation" or OFs). It's being built as a migration/modernization from an existing Bubble.io application at `app.mentore.fr` to a new SvelteKit/Supabase stack.

The app is built on top of [Mentore.fr](https://mentore.fr), which is the leading matchmaking platform for professional trainers in France.

## Target Users

### Primary Users: French Training Centers (Organismes de Formation)

| Role | French Label | Description |
|------|--------------|-------------|
| Owner | Directeur | Full access to all features, workspace settings, and team management |
| Admin | Gestionnaire | Full access to operations, can manage team |
| Sales | Commercial | Access to Deals, Clients, Dashboard (sales stats), Messaging |
| Secretary | Coordinateur administratif | Access to Formations, Qualiopi, Formateurs, Messaging |

### Secondary Users

- **Independent Trainers (Formateurs)**: Professionals who deliver training sessions
- **Client Companies**: Organizations sending employees for training
- **Learners (Apprenants)**: Individuals receiving training

## Mission & Core Goals

### 1. Administrative Simplification
Automate the generation of mandatory French training documents:
- **Conventions de formation** (Training agreements)
- **Feuilles d'émargement** (Attendance sheets)
- **Convocations** (Training summons)
- **Attestations de fin de formation** (Completion certificates)
- **Ordres de mission** (Mission orders for instructors)

### 2. Qualiopi Compliance
Help training centers meet the **Qualiopi** certification requirements - France's national quality standard for training organizations (mandatory since January 2022 for public funding eligibility).

### 3. Trainer Matchmaking (Coming Soon)
Enable training centers to find and book qualified independent trainers from the Mentore network directly within the app.

### 4. Multi-Tenant Workspaces
Allow management of multiple training centers or departments from a single account with role-based access control.

## Key Concepts

### Formations (Training Programs)
A formation represents a training program/course with:
- Basic info (name, description, duration, modality)
- Client association
- Thematic categorization
- Financing type (CPF, OPCO, Inter, Intra)
- Status tracking (En attente → En cours → Terminée)
- 10-step administrative workflow

### The 10-Step Administrative Workflow
Each formation goes through a structured administrative process:

1. **Vérifications des informations** - Verify formation info and add learners
2. **Convention et programme** - Generate convention and training program
3. **Analyse des besoins** - Schedule needs analysis sessions
4. **Convocation** - Generate and send convocations to learners
5. **Ordre de mission** - Generate mission orders for instructors
6. **Attestation de fin de mission** - Generate completion certificates
7. **Questionnaires de satisfaction** - Manage satisfaction surveys (hot/cold)
8. **Documents formateur** - Collect required instructor documents
9. **Facturation** - Handle billing and invoicing
10. **Dossier complet** - Final review and file closure

### Deals (Sales Pipeline)
CRM functionality for tracking sales opportunities:
- Stages: Lead → Qualification → Proposition → Négociation → Gagné/Perdu
- Associated with clients and can link to formations

### Apprenants (Learners)
Individuals enrolled in training programs, with:
- Personal info (name, email)
- Function/role in their company
- Group assignment
- Association with client company

### Formateurs (Instructors)
Independent trainers with:
- Hourly rate range
- Skills/thematiques
- Location/availability
- Rating and experience

## Technical Stack

| Layer | Technology |
|-------|------------|
| Framework | SvelteKit (latest) with Svelte 5 Runes |
| Database | Supabase (PostgreSQL) |
| ORM | Drizzle ORM |
| UI Components | shadcn-svelte |
| Styling | TailwindCSS |
| Authentication | Supabase Auth |
| Security | Row-Level Security (RLS) |

## Repository Structure

```
/workspace
├── docs/                    # Documentation
│   ├── bubble/              # Bubble app analysis for feature parity
│   ├── database.md          # Database workflow guide
│   └── git-workflow.md      # Git branching standards
├── src/
│   ├── lib/
│   │   ├── components/      # Svelte components
│   │   ├── db/              # Drizzle schema and database
│   │   ├── server/          # Server-side utilities (guards, workspace)
│   │   └── settings/        # App configuration
│   └── routes/
│       ├── (app)/           # Authenticated app routes
│       │   ├── formations/  # Formations management
│       │   ├── deals/       # CRM/Deals
│       │   ├── contacts/    # Contacts and formateurs
│       │   ├── qualiopi/    # Quality management
│       │   └── ...
│       └── auth/            # Authentication flows
├── supabase/
│   └── migrations/          # Database migrations
└── .agent/                  # AI agent configuration
    ├── rules.md             # Project rules for agents
    └── workflows/           # Workflow guides for agents
```

## Related Documentation

- [Database Workflow](./database.md) - How to make schema changes
- [Git Workflow](./git-workflow.md) - Branching and release standards
- [Bubble Analysis](./bubble/README.md) - Feature parity analysis
- [Project Roadmap](./PROJECT_ROADMAP.md) - Development timeline and milestones
- [Svelte 5 Runes Guide](./svelte5-runes.md) - Reactivity patterns
- [shadcn-svelte Guide](./shadcn-svelte.md) - UI component usage
