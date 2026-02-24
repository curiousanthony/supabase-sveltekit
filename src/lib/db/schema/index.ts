/**
 * Database schema — domain split for maintainability.
 * Re-export order: base tables first, then dependents.
 */

export * from './enums';
export * from './workspaces';
export * from './users';
export * from './thematiques';
export * from './clients';
export * from './contacts';
export * from './companies';
export * from './workspace-members';
export * from './formations';
export * from './apprenants';
export * from './seances';
export * from './formateurs';
export * from './deals';
