import { pgTable, foreignKey, timestamp, uuid, text, time, date } from 'drizzle-orm/pg-core';
import { users } from './users';
import { modules } from './formations';

export const seances = pgTable(
	'seances',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		moduleId: uuid('module_id').notNull(),
		startTime: time('start_time').notNull(),
		endTime: time('end_time').notNull(),
		location: text(),
		instructor: uuid(),
		date: date().notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'seances_created_by_fkey'
		}),
		foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: 'seances_module_id_fkey'
		}),
		foreignKey({
			columns: [table.instructor],
			foreignColumns: [users.id],
			name: 'seances_instructor_fkey'
		})
	]
);
