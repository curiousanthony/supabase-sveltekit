import { pgTable, foreignKey, timestamp, uuid, text } from 'drizzle-orm/pg-core';
import { clients } from './clients';

export const apprenants = pgTable(
	'apprenants',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		firstName: text('first_name').notNull(),
		lastName: text('last_name').notNull(),
		email: text().notNull(),
		isTraineeOf: uuid('is_trainee_of')
	},
	(table) => [
		foreignKey({
			columns: [table.isTraineeOf],
			foreignColumns: [clients.id],
			name: 'attendees_is_trainee_of_fkey'
		})
	]
);
