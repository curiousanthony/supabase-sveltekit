import { pgTable, foreignKey, timestamp, uuid, text } from 'drizzle-orm/pg-core';

export const thematiques = pgTable('thematiques', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull()
});

export const sousthematiques = pgTable(
	'sousthematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		name: text().notNull(),
		parentTopicId: uuid('parent_topic_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.parentTopicId],
			foreignColumns: [thematiques.id],
			name: 'subtopics_parent_topic_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);
