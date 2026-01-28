# Bubble Application - Database Schema Analysis

## Overview

This document details the database structure used in the Bubble.io application for "Besoins OF" (Formations) management. The analysis is based on network requests, API responses, and form field structures observed in the application.

## Analysis Methodology

1. Inspect network requests when loading pages
2. Analyze API responses for data structure
3. Examine form fields to infer database columns
4. Map relationships based on dropdowns and related data

## Main Tables

### Besoins OF (Formations) Table

_[To be filled in after network request analysis]_

#### Table Name

- **Bubble Table Name**: `besoins_of` or `formations` or `[actual name]`
- **Estimated Name**: _[based on analysis]_

#### Columns

| Column Name         | Data Type           | Required | Default           | Notes                          |
| ------------------- | ------------------- | -------- | ----------------- | ------------------------------ |
| `id`                | Text/UUID           | Yes      | Auto-generated    | Primary key                    |
| `created_date`      | Date/DateTime       | Yes      | Current timestamp | When record was created        |
| `modified_date`     | Date/DateTime       | No       | -                 | Last modification time         |
| `name`              | Text                | Yes/No   | -                 | Formation name/title           |
| `description`       | Text                | No       | -                 | Formation description          |
| `client_id`         | Thing (User/Client) | Yes/No   | -                 | Reference to client            |
| `duree`             | Number              | Yes/No   | -                 | Duration in hours              |
| `modalite`          | Text/Enum           | Yes/No   | -                 | Modality type                  |
| `statut`            | Text/Enum           | Yes      | 'En attente'      | Status                         |
| `thematique_id`     | Thing               | No       | -                 | Reference to thematic          |
| `sousthematique_id` | Thing               | No       | -                 | Reference to sub-thematic      |
| `code_rncp`         | Text                | No       | -                 | RNCP code                      |
| `type_financement`  | Text/Enum           | No       | -                 | Financement type               |
| `workspace_id`      | Thing               | Yes      | -                 | Reference to workspace         |
| `created_by`        | Thing (User)        | Yes      | Current user      | Creator reference              |
| `id_in_workspace`   | Number              | No       | -                 | Sequential ID within workspace |

_[Additional columns to be documented after analysis]_

#### Enums/Options

**Modalité (Modality)**

- Distanciel
- Présentiel
- Hybride
- E-Learning

**Statut (Status)**

- En attente
- En cours
- Terminée

**Type de Financement (Financement Type)**

- CPF
- OPCO
- Inter
- Intra

#### Indexes

_[Document any indexes - likely on: id, client_id, workspace_id, statut]_

#### Constraints

_[Document constraints - foreign keys, unique constraints, etc.]_

### Clients Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `clients` or `[actual name]`

#### Columns

| Column Name    | Data Type     | Required | Default           | Notes                   |
| -------------- | ------------- | -------- | ----------------- | ----------------------- |
| `id`           | Text/UUID     | Yes      | Auto-generated    | Primary key             |
| `created_date` | Date/DateTime | Yes      | Current timestamp |                         |
| `type`         | Text/Enum     | Yes/No   | -                 | Entreprise, Particulier |
| `legal_name`   | Text          | Yes/No   | -                 | Company/legal name      |
| `email`        | Text          | No       | -                 | Contact email           |
| `siret`        | Number/Text   | No       | -                 | SIRET number            |
| `created_by`   | Thing (User)  | Yes      | Current user      | Creator reference       |

_[Additional columns to be documented]_

#### Relationships

- One-to-many with Besoins OF (one client can have many formations)

### Modules Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `modules` or `[actual name]`

#### Columns

| Column Name      | Data Type     | Required | Default           | Notes                  |
| ---------------- | ------------- | -------- | ----------------- | ---------------------- |
| `id`             | Text/UUID     | Yes      | Auto-generated    | Primary key            |
| `created_date`   | Date/DateTime | Yes      | Current timestamp |                        |
| `name`           | Text          | Yes      | -                 | Module name/title      |
| `duration_hours` | Number        | No       | -                 | Duration in hours      |
| `objectives`     | Text          | No       | -                 | Module objectives      |
| `order_index`    | Number        | No       | -                 | Display order          |
| `formation_id`   | Thing         | Yes      | -                 | Reference to formation |
| `created_by`     | Thing (User)  | Yes      | Current user      | Creator reference      |

_[Additional columns to be documented]_

#### Relationships

- Many-to-one with Besoins OF (many modules belong to one formation)

### Thématiques Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `thematiques` or `topics` or `[actual name]`

#### Columns

| Column Name    | Data Type     | Required | Default           | Notes         |
| -------------- | ------------- | -------- | ----------------- | ------------- |
| `id`           | Text/UUID     | Yes      | Auto-generated    | Primary key   |
| `created_date` | Date/DateTime | Yes      | Current timestamp |               |
| `name`         | Text          | Yes      | -                 | Thematic name |

#### Relationships

- One-to-many with Besoins OF
- One-to-many with Sous-thématiques

### Sous-thématiques Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `sousthematiques` or `subtopics` or `[actual name]`

#### Columns

| Column Name       | Data Type     | Required | Default           | Notes                        |
| ----------------- | ------------- | -------- | ----------------- | ---------------------------- |
| `id`              | Text/UUID     | Yes      | Auto-generated    | Primary key                  |
| `created_date`    | Date/DateTime | Yes      | Current timestamp |                              |
| `name`            | Text          | Yes      | -                 | Sub-thematic name            |
| `parent_topic_id` | Thing         | Yes      | -                 | Reference to parent thematic |

#### Relationships

- Many-to-one with Thématiques
- One-to-many with Besoins OF

### Users Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `users` or `[actual name]`

#### Columns

| Column Name    | Data Type     | Required | Default           | Notes               |
| -------------- | ------------- | -------- | ----------------- | ------------------- |
| `id`           | Text/UUID     | Yes      | Auto-generated    | Primary key         |
| `email`        | Text          | Yes      | -                 | User email (unique) |
| `first_name`   | Text          | No       | -                 | First name          |
| `last_name`    | Text          | No       | -                 | Last name           |
| `avatar_url`   | Text          | No       | -                 | Avatar image URL    |
| `created_date` | Date/DateTime | Yes      | Current timestamp |                     |

_[Additional columns to be documented]_

### Workspaces Table

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `workspaces` or `[actual name]`

#### Columns

| Column Name    | Data Type     | Required | Default           | Notes          |
| -------------- | ------------- | -------- | ----------------- | -------------- |
| `id`           | Text/UUID     | Yes      | Auto-generated    | Primary key    |
| `name`         | Text/Varchar  | Yes/No   | -                 | Workspace name |
| `created_date` | Date/DateTime | Yes      | Current timestamp |                |

### Workspaces Users (Junction Table)

_[To be documented after analysis]_

#### Table Name

- **Bubble Table Name**: `workspaces_users` or `[actual name]`

#### Columns

| Column Name    | Data Type     | Required | Default           | Notes                  |
| -------------- | ------------- | -------- | ----------------- | ---------------------- |
| `id`           | Text/UUID     | Yes      | Auto-generated    | Primary key            |
| `workspace_id` | Thing         | Yes      | -                 | Reference to workspace |
| `user_id`      | Thing         | Yes      | -                 | Reference to user      |
| `created_date` | Date/DateTime | Yes      | Current timestamp |                        |

#### Relationships

- Many-to-many between Workspaces and Users

## Additional Tables (If Present)

### Apprenants (Learners) Table

_[To be documented if present]_

### Séances (Sessions) Table

_[To be documented if present]_

### Formateurs (Instructors) Table

_[To be documented if present]_

### Formateurs Thématiques (Junction Table)

_[To be documented if present]_

## Relationships Summary

### Entity Relationship Diagram

```
Workspaces
  ├── 1:N → Workspaces Users
  │         └── N:1 → Users
  └── 1:N → Besoins OF
            ├── N:1 → Clients
            ├── N:1 → Users (created_by)
            ├── N:1 → Thématiques
            ├── N:1 → Sous-thématiques
            └── 1:N → Modules
                    └── N:1 → Users (created_by)
```

## Data Types Mapping

### Bubble to PostgreSQL/Drizzle Mapping

| Bubble Type    | PostgreSQL Type | Drizzle Type              | Notes                     |
| -------------- | --------------- | ------------------------- | ------------------------- |
| Text           | TEXT            | `text()`                  | String data               |
| Number         | INTEGER/NUMERIC | `integer()` / `numeric()` | Based on precision needed |
| Date           | TIMESTAMP       | `timestamp()`             | With timezone             |
| Yes/No         | BOOLEAN         | `boolean()`               | True/false                |
| Thing          | UUID            | `uuid()`                  | Foreign key reference     |
| List of Things | UUID[]          | Array or junction table   | Many-to-many              |

## API Endpoints Observed

_[Document API endpoints from network requests]_

### Besoins OF Endpoints

- `GET /api/thing/besoins_of` - List all
- `GET /api/thing/besoins_of/:id` - Get one
- `POST /api/thing/besoins_of` - Create
- `PATCH /api/thing/besoins_of/:id` - Update
- `DELETE /api/thing/besoins_of/:id` - Delete

_[Actual endpoints to be documented after network analysis]_

## Notes

- Bubble uses "Thing" as a generic reference type for relationships
- Bubble automatically handles created_date and modified_date
- Bubble uses unique IDs (usually text/UUID format)
- _[Additional observations]_
