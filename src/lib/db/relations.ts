import { relations } from "drizzle-orm/relations";
import { users, clients, workspaces, workspacesUsers, thematiques, sousthematiques, formations, modules, apprenants, seances, formateurs, formateursThematiques } from "./schema";

export const clientsRelations = relations(clients, ({one, many}) => ({
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	apprenants: many(apprenants),
}));

export const usersRelations = relations(users, ({many}) => ({
	clients: many(clients),
	workspacesUsers: many(workspacesUsers),
	formations: many(formations),
	modules: many(modules),
	seances_createdBy: many(seances, {
		relationName: "seances_createdBy_users_id"
	}),
	seances_instructor: many(seances, {
		relationName: "seances_instructor_users_id"
	}),
	formateurs: many(formateurs),
}));

export const workspacesUsersRelations = relations(workspacesUsers, ({one}) => ({
	workspace: one(workspaces, {
		fields: [workspacesUsers.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [workspacesUsers.userId],
		references: [users.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({many}) => ({
	workspacesUsers: many(workspacesUsers),
	formations: many(formations),
}));

export const sousthematiquesRelations = relations(sousthematiques, ({one, many}) => ({
	thematique: one(thematiques, {
		fields: [sousthematiques.parentTopicId],
		references: [thematiques.id]
	}),
	formations: many(formations),
}));

export const thematiquesRelations = relations(thematiques, ({many}) => ({
	sousthematiques: many(sousthematiques),
	formations: many(formations),
	formateursThematiques: many(formateursThematiques),
}));

export const formationsRelations = relations(formations, ({one, many}) => ({
	workspace: one(workspaces, {
		fields: [formations.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [formations.createdBy],
		references: [users.id]
	}),
	sousthematique: one(sousthematiques, {
		fields: [formations.subtopicsIds],
		references: [sousthematiques.id]
	}),
	thematique: one(thematiques, {
		fields: [formations.topicId],
		references: [thematiques.id]
	}),
	modules: many(modules),
}));

export const modulesRelations = relations(modules, ({one, many}) => ({
	user: one(users, {
		fields: [modules.createdBy],
		references: [users.id]
	}),
	formation: one(formations, {
		fields: [modules.courseId],
		references: [formations.id]
	}),
	seances: many(seances),
}));

export const apprenantsRelations = relations(apprenants, ({one}) => ({
	client: one(clients, {
		fields: [apprenants.isTraineeOf],
		references: [clients.id]
	}),
}));

export const seancesRelations = relations(seances, ({one}) => ({
	user_createdBy: one(users, {
		fields: [seances.createdBy],
		references: [users.id],
		relationName: "seances_createdBy_users_id"
	}),
	module: one(modules, {
		fields: [seances.moduleId],
		references: [modules.id]
	}),
	user_instructor: one(users, {
		fields: [seances.instructor],
		references: [users.id],
		relationName: "seances_instructor_users_id"
	}),
}));

export const formateursRelations = relations(formateurs, ({one, many}) => ({
	user: one(users, {
		fields: [formateurs.userId],
		references: [users.id]
	}),
	formateursThematiques: many(formateursThematiques),
}));

export const formateursThematiquesRelations = relations(formateursThematiques, ({one}) => ({
	thematique: one(thematiques, {
		fields: [formateursThematiques.thematiqueId],
		references: [thematiques.id]
	}),
	formateur: one(formateurs, {
		fields: [formateursThematiques.formateurId],
		references: [formateurs.id]
	}),
}));