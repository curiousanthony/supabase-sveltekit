import { pgTable, uniqueIndex, index, foreignKey, integer, varchar, timestamp, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const roles = pgEnum("roles", ['admin', 'formateur', 'assistant', 'dev'])


export const posts = pgTable("posts", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "posts_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	slug: varchar(),
	title: varchar({ length: 256 }),
	ownerId: integer("owner_id"),
}, (table) => [
	uniqueIndex("slug_idx").using("btree", table.slug.asc().nullsLast().op("text_ops")),
	index("title_idx").using("btree", table.title.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "posts_owner_id_users_id_fk"
		}),
]);

export const comments = pgTable("comments", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "comments_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	text: varchar({ length: 256 }),
	postId: integer("post_id"),
	ownerId: integer("owner_id"),
}, (table) => [
	foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: "comments_owner_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [posts.id],
			name: "comments_post_id_posts_id_fk"
		}),
]);

export const users = pgTable("users", {
	id: integer().primaryKey().generatedAlwaysAsIdentity({ name: "users_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	firstName: varchar("first_name", { length: 256 }),
	lastName: varchar("last_name", { length: 256 }),
	email: varchar().notNull(),
	invitee: integer(),
	role: roles().default('admin'),
}, (table) => [
	uniqueIndex("email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.invitee],
			foreignColumns: [table.id],
			name: "users_invitee_users_id_fk"
		}),
]);

export const workspaces = pgTable("workspaces", {
	id: integer().primaryKey().generatedByDefaultAsIdentity({ name: "workspaces_id_seq", startWith: 1, increment: 1, minValue: 1, maxValue: 2147483647, cache: 1 }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar(),
}, (table) => [
	foreignKey({
			columns: [table.id],
			foreignColumns: [users.id],
			name: "workspaces_id_fkey"
		}),
]);
