import { pgTable, uuid, text, smallint } from 'drizzle-orm/pg-core';

/**
 * Industries / secteurs d'activité alignés avec les OPCO (opérateurs de compétences)
 * pour le financement de la formation professionnelle en France.
 * Modifiable en base pour ajouter d'autres secteurs sans déploiement.
 */
export const industries = pgTable('industries', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text('name').notNull().unique(),
	displayOrder: smallint('display_order').default(0).notNull()
});
