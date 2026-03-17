import { relations } from 'drizzle-orm/relations';
import {
	users,
	clients,
	contacts,
	companies,
	contactCompanies,
	dealCompanies,
	workspaces,
	workspacesUsers,
	workspaceInvites,
	thematiques,
	sousthematiques,
	industries,
	formations,
	formationWorkflowSteps,
	modules,
	apprenants,
	seances,
	formateurs,
	formateursThematiques,
	deals,
	biblioModules,
	biblioProgrammes,
	biblioProgrammeModules,
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioSupports,
	biblioProgrammeSupports,
	biblioModuleSupports
} from './schema';

export const industriesRelations = relations(industries, ({ many }) => ({
	companies: many(companies)
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
	user: one(users, {
		fields: [clients.createdBy],
		references: [users.id]
	}),
	apprenants: many(apprenants),
	deals: many(deals)
}));

export const contactsRelations = relations(contacts, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [contacts.workspaceId],
		references: [workspaces.id]
	}),
	owner: one(users, {
		fields: [contacts.ownerId],
		references: [users.id],
		relationName: 'contact_owner'
	}),
	createdByUser: one(users, {
		fields: [contacts.createdBy],
		references: [users.id]
	}),
	contactCompanies: many(contactCompanies),
	deals: many(deals)
}));

export const companiesRelations = relations(companies, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [companies.workspaceId],
		references: [workspaces.id]
	}),
	industry: one(industries, {
		fields: [companies.industryId],
		references: [industries.id]
	}),
	owner: one(users, {
		fields: [companies.ownerId],
		references: [users.id]
	}),
	contactCompanies: many(contactCompanies),
	dealCompanies: many(dealCompanies)
}));

export const contactCompaniesRelations = relations(contactCompanies, ({ one }) => ({
	contact: one(contacts, {
		fields: [contactCompanies.contactId],
		references: [contacts.id]
	}),
	company: one(companies, {
		fields: [contactCompanies.companyId],
		references: [companies.id]
	})
}));

export const dealCompaniesRelations = relations(dealCompanies, ({ one }) => ({
	deal: one(deals, {
		fields: [dealCompanies.dealId],
		references: [deals.id]
	}),
	company: one(companies, {
		fields: [dealCompanies.companyId],
		references: [companies.id]
	})
}));

export const usersRelations = relations(users, ({ many }) => ({
	clients: many(clients),
	contactsOwned: many(contacts, { relationName: 'contact_owner' }),
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
	deals_createdBy: many(deals, { relationName: 'deals_createdBy' }),
	deals_commercial: many(deals, { relationName: 'deals_commercial' })
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
	contacts: many(contacts),
	companies: many(companies),
	deals: many(deals),
	formateurs: many(formateurs),
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
	workspace: one(workspaces, {
		fields: [formateurs.workspaceId],
		references: [workspaces.id]
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

// --- Bibliothèque relations ---

export const biblioModulesRelations = relations(biblioModules, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [biblioModules.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [biblioModules.createdBy],
		references: [users.id]
	}),
	programmeModules: many(biblioProgrammeModules),
	moduleQuestionnaires: many(biblioModuleQuestionnaires),
	moduleSupports: many(biblioModuleSupports)
}));

export const biblioProgrammesRelations = relations(biblioProgrammes, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [biblioProgrammes.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [biblioProgrammes.createdBy],
		references: [users.id]
	}),
	programmeModules: many(biblioProgrammeModules),
	programmeQuestionnaires: many(biblioProgrammeQuestionnaires),
	programmeSupports: many(biblioProgrammeSupports)
}));

export const biblioProgrammeModulesRelations = relations(biblioProgrammeModules, ({ one }) => ({
	programme: one(biblioProgrammes, {
		fields: [biblioProgrammeModules.programmeId],
		references: [biblioProgrammes.id]
	}),
	module: one(biblioModules, {
		fields: [biblioProgrammeModules.moduleId],
		references: [biblioModules.id]
	})
}));

export const biblioQuestionnairesRelations = relations(biblioQuestionnaires, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [biblioQuestionnaires.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [biblioQuestionnaires.createdBy],
		references: [users.id]
	}),
	programmeQuestionnaires: many(biblioProgrammeQuestionnaires),
	moduleQuestionnaires: many(biblioModuleQuestionnaires)
}));

export const biblioProgrammeQuestionnairesRelations = relations(
	biblioProgrammeQuestionnaires,
	({ one }) => ({
		programme: one(biblioProgrammes, {
			fields: [biblioProgrammeQuestionnaires.programmeId],
			references: [biblioProgrammes.id]
		}),
		questionnaire: one(biblioQuestionnaires, {
			fields: [biblioProgrammeQuestionnaires.questionnaireId],
			references: [biblioQuestionnaires.id]
		})
	})
);

export const biblioModuleQuestionnairesRelations = relations(
	biblioModuleQuestionnaires,
	({ one }) => ({
		module: one(biblioModules, {
			fields: [biblioModuleQuestionnaires.moduleId],
			references: [biblioModules.id]
		}),
		questionnaire: one(biblioQuestionnaires, {
			fields: [biblioModuleQuestionnaires.questionnaireId],
			references: [biblioQuestionnaires.id]
		})
	})
);

export const biblioSupportsRelations = relations(biblioSupports, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [biblioSupports.workspaceId],
		references: [workspaces.id]
	}),
	createdByUser: one(users, {
		fields: [biblioSupports.createdBy],
		references: [users.id]
	}),
	programmeSupports: many(biblioProgrammeSupports),
	moduleSupports: many(biblioModuleSupports)
}));

export const biblioProgrammeSupportsRelations = relations(biblioProgrammeSupports, ({ one }) => ({
	programme: one(biblioProgrammes, {
		fields: [biblioProgrammeSupports.programmeId],
		references: [biblioProgrammes.id]
	}),
	support: one(biblioSupports, {
		fields: [biblioProgrammeSupports.supportId],
		references: [biblioSupports.id]
	})
}));

export const biblioModuleSupportsRelations = relations(biblioModuleSupports, ({ one }) => ({
	module: one(biblioModules, {
		fields: [biblioModuleSupports.moduleId],
		references: [biblioModules.id]
	}),
	support: one(biblioSupports, {
		fields: [biblioModuleSupports.supportId],
		references: [biblioSupports.id]
	})
}));

export const dealsRelations = relations(deals, ({ one, many }) => ({
	workspace: one(workspaces, {
		fields: [deals.workspaceId],
		references: [workspaces.id]
	}),
	client: one(clients, {
		fields: [deals.clientId],
		references: [clients.id]
	}),
	contact: one(contacts, {
		fields: [deals.contactId],
		references: [contacts.id]
	}),
	company: one(companies, {
		fields: [deals.companyId],
		references: [companies.id]
	}),
	programme: one(biblioProgrammes, {
		fields: [deals.programmeId],
		references: [biblioProgrammes.id]
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
	commercial: one(users, {
		fields: [deals.commercialId],
		references: [users.id],
		relationName: 'deals_commercial'
	}),
	formation: one(formations, {
		fields: [deals.formationId],
		references: [formations.id]
	}),
	dealCompanies: many(dealCompanies)
}));
