import { relations } from 'drizzle-orm/relations';
import {
	users,
	clients,
	workspaces,
	workspacesUsers,
	workspaceInvites,
	thematiques,
	sousthematiques,
	formations,
	formationWorkflowSteps,
	modules,
	apprenants,
	seances,
	formateurs,
	formateursThematiques,
	deals
} from './schema';

export const clientsRelations = relations(clients, ({ one, many }) => ({
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	apprenants: many(apprenants),
	deals: many(deals)
}));

export const usersRelations = relations(users, ({ many }) => ({
	clients: many(clients),
	workspacesUsers: many(workspacesUsers),
	formations: many(formations),
	modules: many(modules),
	seances_createdBy: many(seances, {
		relationName: 'seances_createdBy_users_id'
	}),
	seances_instructor: many(seances, {
		relationName: 'seances_instructor_users_id'
	}),
	formateurs: many(formateurs),
	deals_owner: many(deals, { relationName: 'deals_owner' }),
	deals_createdBy: many(deals, { relationName: 'deals_createdBy' })
}));

export const workspacesUsersRelations = relations(workspacesUsers, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [workspacesUsers.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [workspacesUsers.userId],
		references: [users.id]
	})
}));

export const workspacesRelations = relations(workspaces, ({ many }) => ({
	workspacesUsers: many(workspacesUsers),
	formations: many(formations),
	deals: many(deals),
	invites: many(workspaceInvites)
}));

export const workspaceInvitesRelations = relations(workspaceInvites, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [workspaceInvites.workspaceId],
		references: [workspaces.id]
	}),
	invitedByUser: one(users, {
		fields: [workspaceInvites.invitedBy],
		references: [users.id]
	})
}));

export const sousthematiquesRelations = relations(sousthematiques, ({ one, many }) => ({
	thematique: one(thematiques, {
		fields: [sousthematiques.parentTopicId],
		references: [thematiques.id]
	}),
	formations: many(formations)
}));

export const thematiquesRelations = relations(thematiques, ({ many }) => ({
	sousthematiques: many(sousthematiques),
	formations: many(formations),
	formateursThematiques: many(formateursThematiques)
}));

export const formationsRelations = relations(formations, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [formations.workspaceId],
		references: [workspaces.id]
	}),
	user: one(users, {
		fields: [formations.createdBy],
		references: [users.id]
	}),
	client: one(clients, {
		fields: [formations.clientId],
		references: [clients.id]
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
	workflowSteps: many(formationWorkflowSteps),
	dealsFromFormation: many(deals)
}));

export const formationWorkflowStepsRelations = relations(formationWorkflowSteps, ({ one }) => ({
	formation: one(formations, {
		fields: [formationWorkflowSteps.formationId],
		references: [formations.id]
	}),
	completedByUser: one(users, {
		fields: [formationWorkflowSteps.completedBy],
		references: [users.id]
	})
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
	user: one(users, {
		fields: [modules.createdBy],
		references: [users.id]
	}),
	formation: one(formations, {
		fields: [modules.courseId],
		references: [formations.id]
	}),
	seances: many(seances)
}));

export const apprenantsRelations = relations(apprenants, ({ one }) => ({
	client: one(clients, {
		fields: [apprenants.isTraineeOf],
		references: [clients.id]
	})
}));

export const seancesRelations = relations(seances, ({ one }) => ({
	user_createdBy: one(users, {
		fields: [seances.createdBy],
		references: [users.id],
		relationName: 'seances_createdBy_users_id'
	}),
	module: one(modules, {
		fields: [seances.moduleId],
		references: [modules.id]
	}),
	user_instructor: one(users, {
		fields: [seances.instructor],
		references: [users.id],
		relationName: 'seances_instructor_users_id'
	})
}));

export const formateursRelations = relations(formateurs, ({ one, many }) => ({
	user: one(users, {
		fields: [formateurs.userId],
		references: [users.id]
	}),
	formateursThematiques: many(formateursThematiques)
}));

export const formateursThematiquesRelations = relations(formateursThematiques, ({ one }) => ({
	thematique: one(thematiques, {
		fields: [formateursThematiques.thematiqueId],
		references: [thematiques.id]
	}),
	formateur: one(formateurs, {
		fields: [formateursThematiques.formateurId],
		references: [formateurs.id]
	})
}));

export const dealsRelations = relations(deals, ({ one }) => ({
	workspace: one(workspaces, {
		fields: [deals.workspaceId],
		references: [workspaces.id]
	}),
	client: one(clients, {
		fields: [deals.clientId],
		references: [clients.id]
	}),
	owner: one(users, {
		fields: [deals.ownerId],
		references: [users.id],
		relationName: 'deals_owner'
	}),
	createdByUser: one(users, {
		fields: [deals.createdBy],
		references: [users.id],
		relationName: 'deals_createdBy'
	}),
	formation: one(formations, {
		fields: [deals.formationId],
		references: [formations.id]
	})
}));
