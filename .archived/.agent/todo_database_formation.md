# Postponed Database & Schema Tasks

These tasks were identified during the planning of the Formation Creation flow but were postponed to prioritize UI and logic development.

## Schema Changes

- [ ] **Modules Table**: Add `objectifs` (text) field.
- [ ] **Formations Table**: Add `clientId` (uuid) foreign key.
- [ ] **New Libraries**:
  - [ ] Create `prerequisites` table (id, name, description, createdAt, createdBy, workspaceId).
  - [ ] Create `public_cibles` table (id, name, createdAt, createdBy, workspaceId).
- [ ] **Join Tables**:
  - [ ] Create `formations_prerequisites`.
  - [ ] Create `formations_public_cibles`.

## Backend Integration

- [ ] Replace hardcoded mock data in `src/routes/(app)/formations/creer/+page.server.ts` with real database queries.
- [ ] Update form action to handle data insertion into new tables and join tables.
- [ ] Implement robust error handling for complex multi-table inserts.
