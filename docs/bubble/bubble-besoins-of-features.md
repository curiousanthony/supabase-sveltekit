# Bubble Application - Besoins OF Features Analysis

## Overview

This document details the features and functionality of the "Besoins OF" (Formations) management system in the Bubble.io application.

## List/Index View

### Display Format

_[To be documented after browser analysis]_

- Table view / Card view / List view?
- Number of items per page
- Pagination style

### Filters

_[Document all available filters]_

- Status filter (En attente, En cours, Terminée)
- Client filter
- Date range filter
- Other filters...

### Sorting Options

_[Document sorting capabilities]_

- Sort by date (created/modified)
- Sort by name
- Sort by status
- Other sorting options...

### Search Functionality

_[Document search features]_

- Global search field
- Search by name, client, etc.
- Search scope and behavior

### Actions Available from List View

_[Document actions available on list items]_

- Create new Besoin OF
- Edit existing
- Delete
- Duplicate
- Export
- Bulk actions...

## Create Form

### Form Structure

_[Document the form layout and steps]_

#### Step 1: [Step Name]

- **Field Name** (Type): Description, validation rules, required/optional
- **Field Name** (Type): Description, validation rules, required/optional

#### Step 2: [Step Name]

- **Field Name** (Type): Description, validation rules, required/optional

### Field Details

#### Basic Information

- **Name** (Text):
  - Required: Yes/No
  - Validation: [rules]
  - Default value: [if any]
  - Max length: [if any]

- **Description** (Text/Multiline):
  - Required: Yes/No
  - Validation: [rules]

- **Client** (Dropdown/Select):
  - Required: Yes/No
  - Source: [clients table, etc.]
  - Can create new: Yes/No

- **Duration (Durée)** (Number):
  - Required: Yes/No
  - Unit: hours
  - Min/Max values: [if any]

- **Modality (Modalité)** (Dropdown):
  - Required: Yes/No
  - Options: Distanciel, Présentiel, Hybride, E-Learning
  - Can select multiple: Yes/No

- **Status (Statut)** (Dropdown):
  - Required: Yes/No
  - Options: En attente, En cours, Terminée
  - Default: En attente
  - Can be changed: [when/how]

#### Thematic Information

- **Thématique** (Dropdown):
  - Required: Yes/No
  - Source: thematiques table
  - Can create new: Yes/No

- **Sous-thématique** (Dropdown):
  - Required: Yes/No
  - Source: sousthematiques table
  - Depends on: Thématique selection
  - Can create new: Yes/No

#### Financial Information

- **Type de Financement** (Dropdown):
  - Required: Yes/No
  - Options: CPF, OPCO, Inter, Intra
  - Can select multiple: Yes/No

- **Code RNCP** (Text):
  - Required: Yes/No
  - Validation: [format rules]

#### Module/Program Information

- **Modules** (Repeating Group/List):
  - Can add multiple: Yes/No
  - Fields per module:
    - Name/Title
    - Duration (hours)
    - Objectives
    - Order/Index

#### Additional Fields

_[Document any other fields present in the form]_

### Validation Rules

_[Document all validation rules and error messages]_

### Form Workflow

_[Document the form submission process]_

1. User fills form
2. Validation occurs: [when - on blur, on submit, etc.]
3. On submit: [what happens]
4. Success: [redirect, message, etc.]
5. Error handling: [how errors are displayed]

## Edit Form

### Access Method

_[How to access edit form - button location, permissions, etc.]_

### Differences from Create Form

_[Document any differences in fields, validation, or workflow]_

### Read-only Fields

_[Fields that cannot be edited]_

### Status Change Workflow

_[How status changes are handled during edit]_

## Detail View

### Information Displayed

_[Document all information shown on the detail view]_

#### Header Section

- Formation name
- Status badge
- ID/Reference number
- Created date
- Last modified date

#### Main Content

- Client information
- Duration and modality
- Thematic information
- Financial information
- Modules list
- Other sections...

#### Actions Available

- Edit button
- Delete button
- Duplicate button
- Export button
- Status change buttons
- Other actions...

### Related Data Displayed

_[Document related entities shown]_

- Modules list
- Sessions (Séances)
- Learners (Apprenants)
- Instructors (Formateurs)
- Other related data...

## Status Management

### Status Values

1. **En attente** (Pending)
   - When set: [initial state, manual change, etc.]
   - Can transition to: [En cours, etc.]
   - Restrictions: [what can/cannot be done in this status]

2. **En cours** (In Progress)
   - When set: [automatic, manual, etc.]
   - Can transition to: [Terminée, etc.]
   - Restrictions: [what can/cannot be done in this status]

3. **Terminée** (Completed)
   - When set: [automatic, manual, etc.]
   - Can transition to: [none, etc.]
   - Restrictions: [what can/cannot be done in this status]

### Status Transition Rules

_[Document the rules for changing status]_

- Who can change status
- When status can be changed
- Required conditions for status changes
- Automatic status changes (if any)

## Relationships

### Client Relationship

_[How formations relate to clients]_

- One-to-many: One client can have many formations
- Required: Yes/No
- Cascade delete: Yes/No

### Module Relationship

_[How formations relate to modules]_

- One-to-many: One formation can have many modules
- Required: Yes/No
- Ordering: [how modules are ordered]

### Thematic Relationships

_[How formations relate to themes]_

- Many-to-one with Thématique
- Many-to-one with Sous-thématique
- Required: Yes/No

### User Relationships

_[How formations relate to users]_

- Created by: [user relationship]
- Assigned to: [if any]
- Instructors: [if any]

## UI/UX Patterns

### Form Layout

_[Document form layout patterns]_

- Single page vs multi-step
- Field grouping
- Section headers
- Progress indicator (if multi-step)

### Button Placement

_[Document button locations and styles]_

- Primary actions: [location, style]
- Secondary actions: [location, style]
- Cancel/Back buttons: [location, style]

### Modal/Dialog Usage

_[Document when modals are used]_

- Confirmation dialogs
- Quick edit modals
- Delete confirmations

### Data Display Formats

_[Document how data is displayed]_

- Tables: [columns, sorting, etc.]
- Cards: [layout, information shown]
- Lists: [format, actions]

### Filter/Search Interface

_[Document filter UI]_

- Location: [sidebar, top bar, etc.]
- Style: [dropdowns, checkboxes, etc.]
- Clear filters: [how to reset]

## Comparison with Current Implementation

### Similarities

_[What matches the current SvelteKit implementation]_

### Differences

_[What differs from the current implementation]_

### Missing Features

_[Features in Bubble that are not in current implementation]_

### Additional Features in Current Implementation

_[Features in current implementation that are not in Bubble]_

## Notes

- _[Any additional observations or important notes]_
