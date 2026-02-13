import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	integer,
	uniqueIndex,
	unique,
	varchar,
	numeric,
	time,
	date,
	boolean,
	pgEnum
} from 'drizzle-orm/pg-core';
export const modalites = pgEnum('modalites', ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']);
export const statutsFormation = pgEnum('statuts_formation', ['En attente', 'En cours', 'Terminée']);
export const typeClient = pgEnum('type_client', ['Entreprise', 'Particulier']);
export const typesFinancement = pgEnum('types_financement', ['CPF', 'OPCO', 'Inter', 'Intra']);
export const dealStage = pgEnum('deal_stage', [
	'Lead',
	'Qualification',
	'Proposition',
	'Négociation',
	'Gagné',
	'Perdu'
]);
export const workspaceRole = pgEnum('workspace_role', ['owner', 'admin', 'sales', 'secretary']);
export const modalitesEvaluation = pgEnum('modalites_evaluation', [
	'QCM de fin de formation',
	'Mise en situation pratique',
	'Étude de cas complexe',
	'Entretien avec le formateur'
]);

export const clients = pgTable(
	'clients',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		type: typeClient(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		email: text(),
		siret: integer(),
		legalName: text('legal_name'),
		workspaceId: uuid('workspace_id')
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'clients_created_by_fkey'
		}),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'clients_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const workspacesUsers = pgTable(
	'workspaces_users',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		userId: uuid('user_id').notNull(),
		role: workspaceRole().default('sales').notNull()
	},
	(table) => [
		uniqueIndex('unique_workspace_user').using(
			'btree',
			table.workspaceId.asc().nullsLast().op('uuid_ops'),
			table.userId.asc().nullsLast().op('uuid_ops')
		),
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'workspaces_users_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'workspaces_users_user_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const sousthematiques = pgTable(
	'sousthematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		name: text().notNull(),
		parentTopicId: uuid('parent_topic_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.parentTopicId],
			foreignColumns: [thematiques.id],
			name: 'subtopics_parent_topic_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const users = pgTable(
	'users',
	{
		firstName: text('first_name'),
		lastName: text('last_name'),
		email: text().notNull(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		avatarUrl: text('avatar_url'),
		lastActiveWorkspaceId: uuid('last_active_workspace_id')
	},
	(table) => [
		uniqueIndex('email_idx').using('btree', table.email.asc().nullsLast().op('text_ops')),
		unique('users_id2_key').on(table.id),
		foreignKey({
			columns: [table.lastActiveWorkspaceId],
			foreignColumns: [workspaces.id],
			name: 'users_last_active_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const thematiques = pgTable('thematiques', {
	id: uuid().defaultRandom().primaryKey().notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	name: text().notNull()
});

export const workspaces = pgTable(
	'workspaces',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		name: varchar(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		logoUrl: text('logo_url'),
		legalName: text('legal_name'),
		siret: varchar('siret', { length: 14 })
	},
	(table) => [unique('workspaces_id2_key').on(table.id)]
);

export const formations = pgTable(
	'formations',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		createdBy: uuid('created_by').notNull(),
		name: text(),
		description: text(),
		workspaceId: uuid('workspace_id').notNull(),
		id: uuid().defaultRandom().primaryKey().notNull(),
		topicId: uuid('topic_id'),
		subtopicsIds: uuid('subtopics_ids'),
		duree: integer(),
		modalite: modalites(),
		codeRncp: text('code_rncp'),
		idInWorkspace: integer('id_in_workspace'),
		statut: statutsFormation().default('En attente').notNull(),
		typeFinancement: typesFinancement('type_financement'),
		clientId: uuid('client_id')
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'courses_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'courses_created_by_fkey'
		}),
		foreignKey({
			columns: [table.subtopicsIds],
			foreignColumns: [sousthematiques.id],
			name: 'courses_subtopics_ids_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.topicId],
			foreignColumns: [thematiques.id],
			name: 'formations_topic_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: 'formations_client_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		unique('courses_id2_key').on(table.id)
	]
);

/** Step keys for the 10-step admin workflow (bubble-admin-workflow). */
export const workflowStepKeys = [
	'info_verification',
	'convention_program',
	'needs_analysis',
	'convocation',
	'mission_order',
	'end_certificate',
	'satisfaction_questionnaires',
	'instructor_documents',
	'billing',
	'complete_file'
] as const;

export type WorkflowStepKey = (typeof workflowStepKeys)[number];

export const formationWorkflowSteps = pgTable(
	'formation_workflow_steps',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		stepKey: varchar('step_key', { length: 64 }).notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
		completedBy: uuid('completed_by')
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_workflow_steps_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.completedBy],
			foreignColumns: [users.id],
			name: 'formation_workflow_steps_completed_by_fkey'
		}),
		unique('unique_formation_step').on(table.formationId, table.stepKey)
	]
);

export const modules = pgTable(
	'modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		name: text().notNull(),
		durationHours: numeric('duration_hours'),
		orderIndex: integer('order_index'),
		createdBy: uuid('created_by').notNull(),
		courseId: uuid('course_id').notNull(),
		objectifsPedagogiques: text('objectifs_pedagogiques'),
		modaliteEvaluation: modalitesEvaluation('modalite_evaluation')
	},
	(table) => [
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'modules_created_by_fkey'
		}),
		foreignKey({
			columns: [table.courseId],
			foreignColumns: [formations.id],
			name: 'modules_course_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

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

export const formateurs = pgTable(
	'formateurs',
	{
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		tauxHoraireMin: numeric('taux_horaire_min'),
		tauxHoraireMax: numeric('taux_horaire_max'),
		description: text(),
		departements: text(),
		ville: text(),
		rating: numeric(),
		disponible7J: boolean('disponible_7j'),
		userId: uuid('user_id').notNull(),
		id: uuid().defaultRandom().primaryKey().notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'formateurs_user_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const formateursThematiques = pgTable(
	'formateurs_thematiques',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		thematiqueId: uuid('thematique_id').notNull(),
		formateurId: uuid('formateur_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.thematiqueId],
			foreignColumns: [thematiques.id],
			name: 'formateurs_thematiques_thematique_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.formateurId],
			foreignColumns: [formateurs.id],
			name: 'formateurs_thematiques_formateur_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_formateur_thematique').on(table.thematiqueId, table.formateurId)
	]
);

export const workspaceInvites = pgTable(
	'workspace_invites',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		email: text().notNull(),
		role: workspaceRole().notNull().default('sales'),
		invitedBy: uuid('invited_by').notNull(),
		token: text().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'string' }).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'workspace_invites_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.invitedBy],
			foreignColumns: [users.id],
			name: 'workspace_invites_invited_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const targetPublics = pgTable(
	'target_publics',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		name: text().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'target_publics_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const prerequisites = pgTable(
	'prerequisites',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		name: text().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'prerequisites_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const libraryModules = pgTable(
	'library_modules',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		titre: text().notNull(),
		dureeHours: numeric('duree_hours').notNull(),
		objectifsPedagogiques: text('objectifs_pedagogiques').notNull(),
		modaliteEvaluation: modalitesEvaluation('modalite_evaluation').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'library_modules_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'library_modules_created_by_fkey'
		})
	]
);

export const libraryProgrammes = pgTable(
	'library_programmes',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		titre: text().notNull(),
		duree: integer().notNull(),
		topicId: uuid('topic_id'),
		modalite: modalites().notNull(),
		objectifs: text()
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'library_programmes_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'library_programmes_created_by_fkey'
		}),
		foreignKey({
			columns: [table.topicId],
			foreignColumns: [thematiques.id],
			name: 'library_programmes_topic_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const deals = pgTable(
	'deals',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull(),
		workspaceId: uuid('workspace_id').notNull(),
		clientId: uuid('client_id').notNull(),
		name: text().notNull(),
		description: text(),
		stage: dealStage().default('Lead').notNull(),
		value: numeric('value', { precision: 12, scale: 2 }),
		currency: varchar('currency', { length: 3 }).default('EUR').notNull(),
		ownerId: uuid('owner_id').notNull(),
		createdBy: uuid('created_by').notNull(),
		closedAt: timestamp('closed_at', { withTimezone: true, mode: 'string' }),
		formationId: uuid('formation_id'),
		libraryProgrammeId: uuid('library_programme_id')
	},
	(table) => [
		foreignKey({
			columns: [table.workspaceId],
			foreignColumns: [workspaces.id],
			name: 'deals_workspace_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.clientId],
			foreignColumns: [clients.id],
			name: 'deals_client_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.ownerId],
			foreignColumns: [users.id],
			name: 'deals_owner_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.createdBy],
			foreignColumns: [users.id],
			name: 'deals_created_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('restrict'),
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'deals_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.libraryProgrammeId],
			foreignColumns: [libraryProgrammes.id],
			name: 'deals_library_programme_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const libraryProgrammeTargetPublics = pgTable(
	'library_programme_target_publics',
	{
		libraryProgrammeId: uuid('library_programme_id').notNull(),
		targetPublicId: uuid('target_public_id').notNull()
	},
	(table) => [
		unique('unique_library_programme_target_public').on(
			table.libraryProgrammeId,
			table.targetPublicId
		),
		foreignKey({
			columns: [table.libraryProgrammeId],
			foreignColumns: [libraryProgrammes.id],
			name: 'library_programme_target_publics_programme_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.targetPublicId],
			foreignColumns: [targetPublics.id],
			name: 'library_programme_target_publics_target_public_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const libraryProgrammePrerequisites = pgTable(
	'library_programme_prerequisites',
	{
		libraryProgrammeId: uuid('library_programme_id').notNull(),
		prerequisiteId: uuid('prerequisite_id').notNull()
	},
	(table) => [
		unique('unique_library_programme_prerequisite').on(
			table.libraryProgrammeId,
			table.prerequisiteId
		),
		foreignKey({
			columns: [table.libraryProgrammeId],
			foreignColumns: [libraryProgrammes.id],
			name: 'library_programme_prerequisites_programme_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.prerequisiteId],
			foreignColumns: [prerequisites.id],
			name: 'library_programme_prerequisites_prerequisite_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const libraryProgrammeModules = pgTable(
	'library_programme_modules',
	{
		libraryProgrammeId: uuid('library_programme_id').notNull(),
		libraryModuleId: uuid('library_module_id').notNull(),
		orderIndex: integer('order_index').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.libraryProgrammeId],
			foreignColumns: [libraryProgrammes.id],
			name: 'library_programme_modules_programme_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.libraryModuleId],
			foreignColumns: [libraryModules.id],
			name: 'library_programme_modules_module_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const formationTargetPublics = pgTable(
	'formation_target_publics',
	{
		formationId: uuid('formation_id').notNull(),
		targetPublicId: uuid('target_public_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_target_publics_formation_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.targetPublicId],
			foreignColumns: [targetPublics.id],
			name: 'formation_target_publics_target_public_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);

export const formationPrerequisites = pgTable(
	'formation_prerequisites',
	{
		formationId: uuid('formation_id').notNull(),
		prerequisiteId: uuid('prerequisite_id').notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_prerequisites_formation_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.prerequisiteId],
			foreignColumns: [prerequisites.id],
			name: 'formation_prerequisites_prerequisite_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade')
	]
);
