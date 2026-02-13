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
	deals,
	targetPublics,
	prerequisites,
	libraryModules,
	libraryProgrammes,
	libraryProgrammeTargetPublics,
	libraryProgrammePrerequisites,
	libraryProgrammeModules,
	formationTargetPublics,
	formationPrerequisites
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
	invites: many(workspaceInvites),
	targetPublics: many(targetPublics),
	prerequisites: many(prerequisites),
	libraryModules: many(libraryModules),
	libraryProgrammes: many(libraryProgrammes)
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
	formateursThematiques: many(formateursThematiques),
	libraryProgrammes: many(libraryProgrammes)
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
	dealsFromFormation: many(deals),
	targetPublics: many(formationTargetPublics),
	prerequisites: many(formationPrerequisites)
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
	}),
	libraryProgramme: one(libraryProgrammes, {
		fields: [deals.libraryProgrammeId],
		references: [libraryProgrammes.id]
	})
}));

export const targetPublicsRelations = relations(targetPublics, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [targetPublics.workspaceId],
		references: [workspaces.id]
	}),
	libraryProgrammeTargetPublics: many(libraryProgrammeTargetPublics),
	formationTargetPublics: many(formationTargetPublics)
}));

export const prerequisitesRelations = relations(prerequisites, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [prerequisites.workspaceId],
		references: [workspaces.id]
	}),
	libraryProgrammePrerequisites: many(libraryProgrammePrerequisites),
	formationPrerequisites: many(formationPrerequisites)
}));

export const libraryModulesRelations = relations(libraryModules, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [libraryModules.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [libraryModules.createdBy],
		references: [users.id]
	}),
	libraryProgrammeModules: many(libraryProgrammeModules)
}));

export const libraryProgrammesRelations = relations(libraryProgrammes, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [libraryProgrammes.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [libraryProgrammes.createdBy],
		references: [users.id]
	}),
	thematique: one(thematiques, {
		fields: [libraryProgrammes.topicId],
		references: [thematiques.id]
	}),
	targetPublics: many(libraryProgrammeTargetPublics),
	prerequisites: many(libraryProgrammePrerequisites),
	libraryProgrammeModules: many(libraryProgrammeModules),
	deals: many(deals)
}));

export const libraryProgrammeTargetPublicsRelations = relations(
	libraryProgrammeTargetPublics,
	({ one }) => ({
		libraryProgramme: one(libraryProgrammes, {
			fields: [libraryProgrammeTargetPublics.libraryProgrammeId],
			references: [libraryProgrammes.id]
		}),
		targetPublic: one(targetPublics, {
			fields: [libraryProgrammeTargetPublics.targetPublicId],
			references: [targetPublics.id]
		})
	})
);

export const libraryProgrammePrerequisitesRelations = relations(
	libraryProgrammePrerequisites,
	({ one }) => ({
		libraryProgramme: one(libraryProgrammes, {
			fields: [libraryProgrammePrerequisites.libraryProgrammeId],
			references: [libraryProgrammes.id]
		}),
		prerequisite: one(prerequisites, {
			fields: [libraryProgrammePrerequisites.prerequisiteId],
			references: [prerequisites.id]
		})
	})
);

export const libraryProgrammeModulesRelations = relations(libraryProgrammeModules, ({ one }) => ({
	libraryProgramme: one(libraryProgrammes, {
		fields: [libraryProgrammeModules.libraryProgrammeId],
		references: [libraryProgrammes.id]
	}),
	libraryModule: one(libraryModules, {
		fields: [libraryProgrammeModules.libraryModuleId],
		references: [libraryModules.id]
	})
}));

export const formationTargetPublicsRelations = relations(formationTargetPublics, ({ one }) => ({
	formation: one(formations, {
		fields: [formationTargetPublics.formationId],
		references: [formations.id]
	}),
	targetPublic: one(targetPublics, {
		fields: [formationTargetPublics.targetPublicId],
		references: [targetPublics.id]
	})
}));

export const formationPrerequisitesRelations = relations(formationPrerequisites, ({ one }) => ({
	formation: one(formations, {
		fields: [formationPrerequisites.formationId],
		references: [formations.id]
	}),
	prerequisite: one(prerequisites, {
		fields: [formationPrerequisites.prerequisiteId],
		references: [prerequisites.id]
	})
}));
