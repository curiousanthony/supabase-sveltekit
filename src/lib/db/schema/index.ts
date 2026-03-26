/**
 * Database schema — domain split for maintainability.
 * Re-export order: base tables first, then dependents.
 */

export * from './enums';
export * from './workspaces';
export * from './users';
export * from './thematiques';
export * from './industries';
export * from './clients';
export * from './contacts';
export * from './companies';
export * from './workspace-members';
export * from './formateurs';
export * from './biblio-modules';
export * from './biblio-programmes';
export * from './formations';
export * from './documents';
export * from './apprenants';
export * from './seances';
export * from './deals';
export * from './biblio-questionnaires';
export * from './biblio-supports';
export * from './module-relations';
