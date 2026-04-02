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
	formationActions,
	questSubActions,
	questDocuments,
	questComments,
	formationAuditLog,
	formationFormateurs,
	formationApprenants,
	formationDocuments,
	formationEmails,
	formationInvoices,
	formationCostItems,
	modules,
	apprenants,
	seances,
	emargements,
	formateurs,
	formateursThematiques,
	formateursSousthematiques,
	deals,
	biblioModules,
	biblioProgrammes,
	biblioProgrammeModules,
	biblioQuestionnaires,
	biblioProgrammeQuestionnaires,
	biblioModuleQuestionnaires,
	biblioSupports,
	biblioProgrammeSupports,
	biblioModuleSupports,
	biblioProgrammeSousthematiques,
	moduleSupports,
	moduleQuestionnaires
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
	deals: many(deals),
	formationApprenants: many(formationApprenants),
	emargements: many(emargements)
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
	dealCompanies: many(dealCompanies),
	formations: many(formations)
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
	formations: many(formations),
	biblioProgrammeSousthematiques: many(biblioProgrammeSousthematiques)
}));

export const thematiquesRelations = relations(thematiques, ({ many }) => ({
	sousthematiques: many(sousthematiques),
	formations: many(formations),
	formateursThematiques: many(formateursThematiques),
	biblioProgrammes: many(biblioProgrammes)
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
	company: one(companies, {
		fields: [formations.companyId],
		references: [companies.id]
	}),
	sousthematique: one(sousthematiques, {
		fields: [formations.subtopicsIds],
		references: [sousthematiques.id]
	}),
	thematique: one(thematiques, {
		fields: [formations.topicId],
		references: [thematiques.id]
	}),
	programmeSource: one(biblioProgrammes, {
		fields: [formations.programmeSourceId],
		references: [biblioProgrammes.id]
	}),
	modules: many(modules),
	workflowSteps: many(formationWorkflowSteps),
	actions: many(formationActions),
	auditLog: many(formationAuditLog),
	formationFormateurs: many(formationFormateurs),
	formationApprenants: many(formationApprenants),
	seances: many(seances, { relationName: 'formation_seances' }),
	documents: many(formationDocuments),
	emails: many(formationEmails),
	invoices: many(formationInvoices),
	costItems: many(formationCostItems),
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
	sourceModule: one(biblioModules, {
		fields: [modules.sourceModuleId],
		references: [biblioModules.id]
	}),
	formateur: one(formateurs, {
		fields: [modules.formateurId],
		references: [formateurs.id]
	}),
	seances: many(seances),
	moduleSupports: many(moduleSupports),
	moduleQuestionnaires: many(moduleQuestionnaires)
}));

export const apprenantsRelations = relations(apprenants, ({ one }) => ({
	client: one(clients, {
		fields: [apprenants.isTraineeOf],
		references: [clients.id]
	})
}));

export const seancesRelations = relations(seances, ({ one, many }) => ({
	user_createdBy: one(users, {
		fields: [seances.createdBy],
		references: [users.id],
		relationName: 'seances_createdBy_users_id'
	}),
	formation: one(formations, {
		fields: [seances.formationId],
		references: [formations.id],
		relationName: 'formation_seances'
	}),
	module: one(modules, {
		fields: [seances.moduleId],
		references: [modules.id]
	}),
	formateur: one(formateurs, {
		fields: [seances.formateurId],
		references: [formateurs.id]
	}),
	emargements: many(emargements)
}));

export const emargementsRelations = relations(emargements, ({ one }) => ({
	seance: one(seances, {
		fields: [emargements.seanceId],
		references: [seances.id]
	}),
	contact: one(contacts, {
		fields: [emargements.contactId],
		references: [contacts.id]
	}),
	formateur: one(formateurs, {
		fields: [emargements.formateurId],
		references: [formateurs.id]
	})
}));

export const formationActionsRelations = relations(formationActions, ({ one, many }) => ({
	formation: one(formations, {
		fields: [formationActions.formationId],
		references: [formations.id]
	}),
	completedByUser: one(users, {
		fields: [formationActions.completedBy],
		references: [users.id]
	}),
	assignee: one(users, {
		fields: [formationActions.assigneeId],
		references: [users.id],
		relationName: 'action_assignee'
	}),
	blockedByAction: one(formationActions, {
		fields: [formationActions.blockedByActionId],
		references: [formationActions.id]
	}),
	subActions: many(questSubActions),
	comments: many(questComments)
}));

export const questSubActionsRelations = relations(questSubActions, ({ one }) => ({
	formationAction: one(formationActions, {
		fields: [questSubActions.formationActionId],
		references: [formationActions.id]
	}),
	completedByUser: one(users, {
		fields: [questSubActions.completedBy],
		references: [users.id]
	}),
	document: one(questDocuments, {
		fields: [questSubActions.id],
		references: [questDocuments.subActionId]
	})
}));

export const formationAuditLogRelations = relations(formationAuditLog, ({ one }) => ({
	formation: one(formations, {
		fields: [formationAuditLog.formationId],
		references: [formations.id]
	}),
	user: one(users, {
		fields: [formationAuditLog.userId],
		references: [users.id]
	})
}));

export const formationFormateursRelations = relations(formationFormateurs, ({ one }) => ({
	formation: one(formations, {
		fields: [formationFormateurs.formationId],
		references: [formations.id]
	}),
	formateur: one(formateurs, {
		fields: [formationFormateurs.formateurId],
		references: [formateurs.id]
	})
}));

export const formationApprenantsRelations = relations(formationApprenants, ({ one }) => ({
	formation: one(formations, {
		fields: [formationApprenants.formationId],
		references: [formations.id]
	}),
	contact: one(contacts, {
		fields: [formationApprenants.contactId],
		references: [contacts.id]
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
	formateursThematiques: many(formateursThematiques),
	formateursSousthematiques: many(formateursSousthematiques),
	formationFormateurs: many(formationFormateurs),
	seances: many(seances),
	emargements: many(emargements)
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

export const formateursSousthematiquesRelations = relations(formateursSousthematiques, ({ one }) => ({
	sousthematique: one(sousthematiques, {
		fields: [formateursSousthematiques.sousthematiqueId],
		references: [sousthematiques.id]
	}),
	formateur: one(formateurs, {
		fields: [formateursSousthematiques.formateurId],
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
	biblioModuleQuestionnaires: many(biblioModuleQuestionnaires),
	biblioModuleSupports: many(biblioModuleSupports),
	derivedModules: many(modules)
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
	thematique: one(thematiques, {
		fields: [biblioProgrammes.topicId],
		references: [thematiques.id]
	}),
	derivedFrom: one(biblioProgrammes, {
		fields: [biblioProgrammes.derivedFromProgrammeId],
		references: [biblioProgrammes.id]
	}),
	programmeModules: many(biblioProgrammeModules),
	programmeQuestionnaires: many(biblioProgrammeQuestionnaires),
	programmeSupports: many(biblioProgrammeSupports),
	programmeSousthematiques: many(biblioProgrammeSousthematiques),
	formations: many(formations)
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
	biblioModuleQuestionnaires: many(biblioModuleQuestionnaires),
	formationModuleQuestionnaires: many(moduleQuestionnaires)
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
	biblioModuleSupports: many(biblioModuleSupports),
	formationModuleSupports: many(moduleSupports)
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

export const questDocumentsRelations = relations(questDocuments, ({ one }) => ({
	subAction: one(questSubActions, {
		fields: [questDocuments.subActionId],
		references: [questSubActions.id]
	}),
	uploadedByUser: one(users, {
		fields: [questDocuments.uploadedBy],
		references: [users.id]
	})
}));

export const questCommentsRelations = relations(questComments, ({ one }) => ({
	formationAction: one(formationActions, {
		fields: [questComments.formationActionId],
		references: [formationActions.id]
	}),
	user: one(users, {
		fields: [questComments.userId],
		references: [users.id]
	})
}));

export const formationDocumentsRelations = relations(formationDocuments, ({ one, many }) => ({
	formation: one(formations, {
		fields: [formationDocuments.formationId],
		references: [formations.id]
	}),
	generatedByUser: one(users, {
		fields: [formationDocuments.generatedBy],
		references: [users.id]
	}),
	relatedContact: one(contacts, {
		fields: [formationDocuments.relatedContactId],
		references: [contacts.id]
	}),
	relatedFormateur: one(formateurs, {
		fields: [formationDocuments.relatedFormateurId],
		references: [formateurs.id]
	}),
	relatedSeance: one(seances, {
		fields: [formationDocuments.relatedSeanceId],
		references: [seances.id]
	}),
	emails: many(formationEmails)
}));

export const formationEmailsRelations = relations(formationEmails, ({ one }) => ({
	formation: one(formations, {
		fields: [formationEmails.formationId],
		references: [formations.id]
	}),
	document: one(formationDocuments, {
		fields: [formationEmails.documentId],
		references: [formationDocuments.id]
	}),
	createdByUser: one(users, {
		fields: [formationEmails.createdBy],
		references: [users.id]
	})
}));

export const formationInvoicesRelations = relations(formationInvoices, ({ one }) => ({
	formation: one(formations, {
		fields: [formationInvoices.formationId],
		references: [formations.id]
	}),
	createdByUser: one(users, {
		fields: [formationInvoices.createdBy],
		references: [users.id]
	})
}));

export const formationCostItemsRelations = relations(formationCostItems, ({ one }) => ({
	formation: one(formations, {
		fields: [formationCostItems.formationId],
		references: [formations.id]
	})
}));

export const biblioProgrammeSousthematiquesRelations = relations(
	biblioProgrammeSousthematiques,
	({ one }) => ({
		programme: one(biblioProgrammes, {
			fields: [biblioProgrammeSousthematiques.programmeId],
			references: [biblioProgrammes.id]
		}),
		sousthematique: one(sousthematiques, {
			fields: [biblioProgrammeSousthematiques.sousthematiqueId],
			references: [sousthematiques.id]
		})
	})
);

export const moduleSupportsRelations = relations(moduleSupports, ({ one }) => ({
	module: one(modules, {
		fields: [moduleSupports.moduleId],
		references: [modules.id]
	}),
	support: one(biblioSupports, {
		fields: [moduleSupports.supportId],
		references: [biblioSupports.id]
	})
}));

export const moduleQuestionnairesRelations = relations(moduleQuestionnaires, ({ one }) => ({
	module: one(modules, {
		fields: [moduleQuestionnaires.moduleId],
		references: [modules.id]
	}),
	questionnaire: one(biblioQuestionnaires, {
		fields: [moduleQuestionnaires.questionnaireId],
		references: [biblioQuestionnaires.id]
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
