import {
	pgTable,
	foreignKey,
	timestamp,
	uuid,
	text,
	integer,
	varchar,
	numeric,
	unique
} from 'drizzle-orm/pg-core';
import { modalites, statutsFormation, typesFinancement } from './enums';
import { workspaces } from './workspaces';
import { users } from './users';
import { thematiques, sousthematiques } from './thematiques';
import { clients } from './clients';

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
