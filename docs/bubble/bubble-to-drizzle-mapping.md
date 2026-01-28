# Bubble to Drizzle Schema Mapping

## Overview

This document maps the Bubble.io database schema to the current Drizzle schema, identifying matches, gaps, and recommendations for porting the Besoins OF (Formations) management system.

## Schema Comparison

### Formations (Besoins OF) Table

#### Current Drizzle Schema

```typescript
export const formations = pgTable('formations', {
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid('created_by').notNull(),
	name: text(),
	description: text(),
	workspaceId: uuid('workspace_id').notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	topicId: uuid('topic_id'),
	subtopicsIds: uuid('subtopics_ids'),
	duree: integer(),
	modalite: modalites(),
	codeRncp: text('code_rncp'),
	idInWorkspace: integer('id_in_workspace'),
	statut: statutsFormation().default('En attente').notNull(),
	typeFinancement: typesFinancement('type_financement')
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

| Bubble Column       | Drizzle Column    | Match | Notes                                |
| ------------------- | ----------------- | ----- | ------------------------------------ |
| `id`                | `id`              | ✅    | Both UUID primary keys               |
| `created_date`      | `created_at`      | ✅    | Both timestamps                      |
| `name`              | `name`            | ✅    | Both text                            |
| `description`       | `description`     | ✅    | Both text                            |
| `client_id`         | ❌                | ❌    | **GAP: Missing client relationship** |
| `duree`             | `duree`           | ✅    | Both integers                        |
| `modalite`          | `modalite`        | ✅    | Both enums                           |
| `statut`            | `statut`          | ✅    | Both enums                           |
| `thematique_id`     | `topicId`         | ✅    | Both UUID foreign keys               |
| `sousthematique_id` | `subtopicsIds`    | ✅    | Both UUID foreign keys               |
| `code_rncp`         | `codeRncp`        | ✅    | Both text                            |
| `type_financement`  | `typeFinancement` | ✅    | Both enums                           |
| `workspace_id`      | `workspaceId`     | ✅    | Both UUID foreign keys               |
| `created_by`        | `createdBy`       | ✅    | Both UUID foreign keys               |
| `id_in_workspace`   | `idInWorkspace`   | ✅    | Both integers                        |
| `modified_date`     | ❌                | ❌    | **GAP: Missing modified timestamp**  |

#### Identified Gaps

1. **Client Relationship Missing**
   - **Bubble**: Has `client_id` field linking to clients table
   - **Drizzle**: No direct client relationship in formations table
   - **Recommendation**: Add `clientId: uuid("client_id")` field to formations table
   - **Impact**: High - Client association is likely important for Besoins OF

2. **Modified Date Missing**
   - **Bubble**: Tracks `modified_date` for audit trail
   - **Drizzle**: Only has `created_at`
   - **Recommendation**: Add `updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull()` field
   - **Impact**: Medium - Useful for tracking changes

3. **Additional Fields** (To be confirmed after analysis)
   - _[Any other fields in Bubble that are missing in Drizzle]_

### Clients Table

#### Current Drizzle Schema

```typescript
export const clients = pgTable('clients', {
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid('created_by').notNull(),
	type: typeClient(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text(),
	siret: integer(),
	legalName: text('legal_name')
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

#### Comparison

| Bubble Column  | Drizzle Column | Match | Notes                                |
| -------------- | -------------- | ----- | ------------------------------------ |
| `id`           | `id`           | ✅    | Both UUID primary keys               |
| `created_date` | `created_at`   | ✅    | Both timestamps                      |
| `type`         | `type`         | ✅    | Both enums (Entreprise, Particulier) |
| `legal_name`   | `legalName`    | ✅    | Both text                            |
| `email`        | `email`        | ✅    | Both text                            |
| `siret`        | `siret`        | ✅    | Both integers                        |
| `created_by`   | `createdBy`    | ✅    | Both UUID foreign keys               |

#### Identified Gaps

_[To be filled in after analysis]_

### Modules Table

#### Current Drizzle Schema

```typescript
export const modules = pgTable('modules', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	durationHours: numeric('duration_hours'),
	orderIndex: integer('order_index'),
	createdBy: uuid('created_by').notNull(),
	courseId: uuid('course_id').notNull()
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

#### Comparison

| Bubble Column    | Drizzle Column  | Match | Notes                             |
| ---------------- | --------------- | ----- | --------------------------------- |
| `id`             | `id`            | ✅    | Both UUID primary keys            |
| `created_date`   | `created_at`    | ✅    | Both timestamps                   |
| `name`           | `name`          | ✅    | Both text                         |
| `duration_hours` | `durationHours` | ✅    | Both numeric                      |
| `order_index`    | `orderIndex`    | ✅    | Both integers                     |
| `formation_id`   | `courseId`      | ✅    | Both UUID foreign keys            |
| `created_by`     | `createdBy`     | ✅    | Both UUID foreign keys            |
| `objectives`     | ❌              | ❌    | **GAP: Missing objectives field** |

#### Identified Gaps

1. **Objectives Field Missing**
   - **Bubble**: Has `objectives` text field for module objectives
   - **Drizzle**: No objectives field
   - **Recommendation**: Add `objectives: text()` field to modules table
   - **Impact**: High - Objectives are important for module definition

### Thématiques Table

#### Current Drizzle Schema

```typescript
export const thematiques = pgTable('thematiques', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull()
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

#### Comparison

| Bubble Column  | Drizzle Column | Match | Notes                  |
| -------------- | -------------- | ----- | ---------------------- |
| `id`           | `id`           | ✅    | Both UUID primary keys |
| `created_date` | `created_at`   | ✅    | Both timestamps        |
| `name`         | `name`         | ✅    | Both text              |

### Sous-thématiques Table

#### Current Drizzle Schema

```typescript
export const sousthematiques = pgTable('sousthematiques', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	parentTopicId: uuid('parent_topic_id').notNull()
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

#### Comparison

| Bubble Column     | Drizzle Column  | Match | Notes                  |
| ----------------- | --------------- | ----- | ---------------------- |
| `id`              | `id`            | ✅    | Both UUID primary keys |
| `created_date`    | `created_at`    | ✅    | Both timestamps        |
| `name`            | `name`          | ✅    | Both text              |
| `parent_topic_id` | `parentTopicId` | ✅    | Both UUID foreign keys |

### Users Table

#### Current Drizzle Schema

```typescript
export const users = pgTable('users', {
	firstName: text('first_name'),
	lastName: text('last_name'),
	email: text().notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	avatarUrl: text('avatar_url')
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

### Workspaces Table

#### Current Drizzle Schema

```typescript
export const workspaces = pgTable('workspaces', {
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar(),
	id: uuid().defaultRandom().primaryKey().notNull()
});
```

#### Bubble Schema (To Be Analyzed)

_[To be filled in after browser analysis]_

## Enum Comparisons

### Modalités

**Drizzle**: `['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']`
**Bubble**: _[To be confirmed]_

✅ **Match Expected** - Same values likely

### Statuts Formation

**Drizzle**: `['En attente', 'En cours', 'Terminée']`
**Bubble**: _[To be confirmed]_

✅ **Match Expected** - Same values likely

### Type Client

**Drizzle**: `['Entreprise', 'Particulier']`
**Bubble**: _[To be confirmed]_

✅ **Match Expected** - Same values likely

### Types Financement

**Drizzle**: `['CPF', 'OPCO', 'Inter', 'Intra']`
**Bubble**: _[To be confirmed]_

✅ **Match Expected** - Same values likely

## Relationship Comparisons

### Current Drizzle Relationships

```typescript
formations
  ├── workspace (N:1)
  ├── user/createdBy (N:1)
  ├── thematique (N:1)
  ├── sousthematique (N:1)
  └── modules (1:N)
```

### Bubble Relationships (To Be Analyzed)

_[To be filled in after analysis]_

### Identified Relationship Gaps

1. **Formations → Clients Relationship**
   - **Status**: ❌ Missing in Drizzle
   - **Bubble**: Has direct client relationship
   - **Recommendation**: Add foreign key `clientId` to formations table
   - **Migration**: Add column and foreign key constraint

## Recommendations

### High Priority

1. **Add Client Relationship to Formations**

   ```typescript
   // Add to formations table
   clientId: (uuid('client_id'),
   	// Add foreign key constraint
   	foreignKey({
   		columns: [table.clientId],
   		foreignColumns: [clients.id],
   		name: 'formations_client_id_fkey'
   	}));
   ```

2. **Add Objectives Field to Modules**

   ```typescript
   // Add to modules table
   objectives: text(),
   ```

3. **Add Updated Timestamp to Formations**
   ```typescript
   // Add to formations table
   updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
   ```

### Medium Priority

_[Additional recommendations after full analysis]_

### Low Priority

_[Nice-to-have improvements after full analysis]_

## Migration Strategy

### Phase 1: Schema Updates

1. Add `clientId` to formations table
2. Add `objectives` to modules table
3. Add `updatedAt` to formations table (and other tables as needed)

### Phase 2: Data Migration

_[If migrating existing data from Bubble]_

1. Export data from Bubble
2. Transform data format
3. Import into Supabase
4. Verify data integrity

### Phase 3: Application Updates

1. Update Drizzle schema files
2. Update relations file
3. Update application code to use new fields
4. Update forms to include new fields
5. Update queries to include relationships

## Notes

- All comparisons are based on current Drizzle schema analysis
- Bubble schema details need to be confirmed through browser analysis
- Some fields may exist in Bubble but not be visible in forms (need API analysis)
- Relationship cardinalities need to be verified

## Next Steps

1. ✅ Complete schema comparison framework
2. ⏳ Analyze Bubble database structure via network requests
3. ⏳ Fill in Bubble schema details
4. ⏳ Complete gap analysis
5. ⏳ Create detailed migration plan
6. ⏳ Update Drizzle schema with missing fields
