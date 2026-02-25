import { sql } from 'drizzle-orm';
import { pgTable, foreignKey, timestamp, uuid, text, check } from 'drizzle-orm/pg-core';
import { users } from './users';
import { modules } from './formations';

/** Session start/end are stored in UTC (timestamptz). Use app timezone only for display/input. */
export const seances = pgTable(
	'seances',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		moduleId: uuid('module_id').notNull(),
		startAt: timestamp('start_at', { withTimezone: true, mode: 'string' }).notNull(),
		endAt: timestamp('end_at', { withTimezone: true, mode: 'string' }).notNull(),
		location: text(),
		instructor: uuid()
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
		}).onDelete('cascade'),
		foreignKey({
			columns: [table.instructor],
			foreignColumns: [users.id],
			name: 'seances_instructor_fkey'
		}),
		check('seances_end_after_start_chk', sql`${table.endAt} > ${table.startAt}`)
	]
);
