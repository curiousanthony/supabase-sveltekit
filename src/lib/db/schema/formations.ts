import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	integer,
	varchar,
	numeric,
	unique,
	boolean,
	date,
	jsonb
} from 'drizzle-orm/pg-core';
import {
	modalites,
	statutsFormation,
	typesFinancement,
	formationType,
	actionStatus,
	actionEtape,
	questPhase
} from './enums';
import { workspaces } from './workspaces';
import { users } from './users';
import { thematiques, sousthematiques } from './thematiques';
import { clients } from './clients';
import { companies } from './companies';
import { biblioProgrammes } from './biblio-programmes';
import { contacts } from './contacts';
import { formateurs } from './formateurs';

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
		statut: statutsFormation().default('À traiter').notNull(),
		typeFinancement: typesFinancement('type_financement'),
		clientId: uuid('client_id'),
		companyId: uuid('company_id'),
		type: formationType('type'),
		dateDebut: date('date_debut'),
		dateFin: date('date_fin'),
		programmeSourceId: uuid('programme_source_id'),
		financementAccorde: boolean('financement_accorde').default(false),
		montantAccorde: numeric('montant_accorde', { precision: 12, scale: 2 }),
		tjmFormateur: numeric('tjm_formateur', { precision: 10, scale: 2 }),
		location: text()
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
		foreignKey({
			columns: [table.companyId],
			foreignColumns: [companies.id],
			name: 'formations_company_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.programmeSourceId],
			foreignColumns: [biblioProgrammes.id],
			name: 'formations_programme_source_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		unique('courses_id2_key').on(table.id),
		unique('formations_workspace_id_in_workspace_unique').on(
			table.workspaceId,
			table.idInWorkspace
		)
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

export const formationActions = pgTable(
	'formation_actions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		title: text().notNull(),
		description: text(),
		status: actionStatus().default('Pas commencé').notNull(),
		etape: actionEtape(),
		phase: questPhase(),
		questKey: varchar('quest_key', { length: 64 }),
		assigneeId: uuid('assignee_id'),
		guidanceDismissed: boolean('guidance_dismissed').default(false).notNull(),
		applicableTo: jsonb('applicable_to'),
		dueDate: date('due_date'),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
		completedBy: uuid('completed_by'),
		blockedByActionId: uuid('blocked_by_action_id'),
		orderIndex: integer('order_index').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_actions_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.completedBy],
			foreignColumns: [users.id],
			name: 'formation_actions_completed_by_fkey'
		}),
		foreignKey({
			columns: [table.assigneeId],
			foreignColumns: [users.id],
			name: 'formation_actions_assignee_id_fkey'
		}),
		foreignKey({
			columns: [table.blockedByActionId],
			foreignColumns: [table.id],
			name: 'formation_actions_blocked_by_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null')
	]
);

export const formationFormateurs = pgTable(
	'formation_formateurs',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		formateurId: uuid('formateur_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_formateurs_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.formateurId],
			foreignColumns: [formateurs.id],
			name: 'formation_formateurs_formateur_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_formation_formateur').on(table.formationId, table.formateurId)
	]
);

export const formationApprenants = pgTable(
	'formation_apprenants',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id').notNull(),
		contactId: uuid('contact_id').notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_apprenants_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.contactId],
			foreignColumns: [contacts.id],
			name: 'formation_apprenants_contact_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		unique('unique_formation_apprenant').on(table.formationId, table.contactId)
	]
);

export const questSubActions = pgTable(
	'quest_sub_actions',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationActionId: uuid('formation_action_id').notNull(),
		title: text().notNull(),
		description: text(),
		completed: boolean().default(false).notNull(),
		completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
		completedBy: uuid('completed_by'),
		orderIndex: integer('order_index').default(0).notNull(),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationActionId],
			foreignColumns: [formationActions.id],
			name: 'quest_sub_actions_formation_action_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('cascade'),
		foreignKey({
			columns: [table.completedBy],
			foreignColumns: [users.id],
			name: 'quest_sub_actions_completed_by_fkey'
		})
	]
);

export const formationAuditLog = pgTable(
	'formation_audit_log',
	{
		id: uuid().defaultRandom().primaryKey().notNull(),
		formationId: uuid('formation_id'),
		userId: uuid('user_id'),
		actionType: text('action_type').notNull(),
		entityType: text('entity_type'),
		entityId: uuid('entity_id'),
		fieldName: text('field_name'),
		oldValue: text('old_value'),
		newValue: text('new_value'),
		createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
			.defaultNow()
			.notNull()
	},
	(table) => [
		foreignKey({
			columns: [table.formationId],
			foreignColumns: [formations.id],
			name: 'formation_audit_log_formation_id_fkey'
		})
			.onUpdate('cascade')
			.onDelete('set null'),
		foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: 'formation_audit_log_user_id_fkey'
		})
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
		courseId: uuid('course_id').notNull()
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
