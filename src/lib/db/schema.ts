import { pgTable, foreignKey, timestamp, uuid, text, integer, uniqueIndex, unique, varchar, numeric, time, date, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const modalites = pgEnum("modalites", ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'])
export const statutsFormation = pgEnum("statuts_formation", ['En attente', 'En cours', 'Terminée'])
export const typeClient = pgEnum("type_client", ['Entreprise', 'Particulier'])


export const clients = pgTable("clients", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull(),
	type: typeClient(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text(),
	siret: integer(),
	legalName: text("legal_name"),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "clients_created_by_fkey"
		}),
]);

export const workspacesUsers = pgTable("workspaces_users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	workspaceId: uuid("workspace_id").notNull(),
	userId: uuid("user_id").notNull(),
}, (table) => [
	uniqueIndex("unique_workspace_user").using("btree", table.workspaceId.asc().nullsLast().op("uuid_ops"), table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "workspaces_users_workspace_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "workspaces_users_user_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const sousthematiques = pgTable("sousthematiques", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	parentTopicId: uuid("parent_topic_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.parentTopicId],
			foreignColumns: [thematiques.id],
			name: "subtopics_parent_topic_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const users = pgTable("users", {
	firstName: text("first_name"),
	lastName: text("last_name"),
	email: text().notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	avatarUrl: text("avatar_url"),
}, (table) => [
	uniqueIndex("email_idx").using("btree", table.email.asc().nullsLast().op("text_ops")),
	unique("users_id2_key").on(table.id),
]);

export const thematiques = pgTable("thematiques", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
});

export const workspaces = pgTable("workspaces", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: varchar(),
	id: uuid().defaultRandom().primaryKey().notNull(),
}, (table) => [
	unique("workspaces_id2_key").on(table.id),
]);

export const modules = pgTable("modules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull(),
	durationHours: numeric("duration_hours"),
	orderIndex: integer("order_index"),
	createdBy: uuid("created_by").notNull(),
	courseId: uuid("course_id").notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "modules_created_by_fkey"
		}),
	foreignKey({
			columns: [table.courseId],
			foreignColumns: [formations.id],
			name: "modules_course_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
]);

export const apprenants = pgTable("apprenants", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	email: text().notNull(),
	isTraineeOf: uuid("is_trainee_of"),
}, (table) => [
	foreignKey({
			columns: [table.isTraineeOf],
			foreignColumns: [clients.id],
			name: "attendees_is_trainee_of_fkey"
		}),
]);

export const seances = pgTable("seances", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull(),
	moduleId: uuid("module_id").notNull(),
	startTime: time("start_time").notNull(),
	endTime: time("end_time").notNull(),
	location: text(),
	instructor: uuid(),
	date: date().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "seances_created_by_fkey"
		}),
	foreignKey({
			columns: [table.moduleId],
			foreignColumns: [modules.id],
			name: "seances_module_id_fkey"
		}),
	foreignKey({
			columns: [table.instructor],
			foreignColumns: [users.id],
			name: "seances_instructor_fkey"
		}),
]);

export const formations = pgTable("formations", {
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	createdBy: uuid("created_by").notNull(),
	name: text(),
	description: text(),
	workspaceId: uuid("workspace_id").notNull(),
	id: uuid().defaultRandom().primaryKey().notNull(),
	topicId: uuid("topic_id"),
	subtopicsIds: uuid("subtopics_ids"),
	duree: integer(),
	modalite: modalites(),
	codeRncp: text("code_rncp"),
	idInWorkspace: integer("id_in_workspace"),
	statut: statutsFormation().default('En attente').notNull(),
}, (table) => [
	foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: "courses_workspace_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: "courses_created_by_fkey"
		}),
	foreignKey({
			columns: [table.subtopicsIds],
			foreignColumns: [sousthematiques.id],
			name: "courses_subtopics_ids_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	foreignKey({
			columns: [table.topicId],
			foreignColumns: [thematiques.id],
			name: "formations_topic_id_fkey"
		}).onUpdate("cascade").onDelete("cascade"),
	unique("courses_id2_key").on(table.id),
]);
