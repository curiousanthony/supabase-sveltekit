import { db } from '$lib/db';
import { formationAuditLog } from '$lib/db/schema';

export interface AuditEntry {
	formationId: string;
	userId: string;
	actionType: string;
	entityType?: string;
	entityId?: string;
	fieldName?: string;
	oldValue?: unknown;
	newValue?: unknown;
}

export async function logAuditEvent(entry: AuditEntry): Promise<void> {
	try {
		await db.insert(formationAuditLog).values({
			formationId: entry.formationId,
			userId: entry.userId,
			actionType: entry.actionType,
			entityType: entry.entityType ?? null,
			entityId: entry.entityId ?? null,
			fieldName: entry.fieldName ?? null,
			oldValue: entry.oldValue != null ? String(entry.oldValue) : null,
			newValue: entry.newValue != null ? String(entry.newValue) : null
		});
	} catch {
		// Non-blocking: don't let audit failures break the app
	}
}

export async function getFormationHistory(formationId: string, limit = 50) {
	const { eq, desc } = await import('drizzle-orm');

	return db.query.formationAuditLog.findMany({
		where: eq(formationAuditLog.formationId, formationId),
		orderBy: [desc(formationAuditLog.createdAt)],
		limit,
		with: {
			user: {
				columns: { id: true, firstName: true, lastName: true, avatarUrl: true, email: true }
			}
		}
	});
}

export const AUDIT_EVENT_TYPES = {
	field_update: { icon: 'Pencil', template: 'a modifié {field}' },
	quest_completed: { icon: 'CheckCircle', template: 'a terminé la quête {entity}' },
	sub_action_toggled: { icon: 'Check', template: 'a {action} {entity}' },
	phase_completed: { icon: 'Trophy', template: 'Phase {entity} terminée !' },
	status_changed: { icon: 'ArrowRightCircle', template: 'a changé le statut à {newValue}' },
	session_created: { icon: 'Calendar', template: 'a créé une séance le {entity}' },
	session_updated: { icon: 'Calendar', template: 'a modifié la séance du {entity}' },
	session_deleted: { icon: 'Trash', template: 'a supprimé la séance du {entity}' },
	learner_added: { icon: 'UserPlus', template: 'a ajouté {entity}' },
	learner_removed: { icon: 'UserMinus', template: 'a retiré {entity}' },
	formateur_added: { icon: 'UserPlus', template: 'a assigné {entity}' },
	formateur_removed: { icon: 'UserMinus', template: 'a retiré {entity}' },
	document_uploaded: { icon: 'FileUp', template: 'a ajouté un document à {entity}' },
	invoice_created: { icon: 'Receipt', template: 'a créé la facture {entity}' },
	invoice_updated: { icon: 'Receipt', template: 'a mis à jour la facture {entity}' },
	comment_added: { icon: 'MessageSquare', template: 'a ajouté une note sur {entity}' },
	cost_updated: { icon: 'Wallet', template: 'a modifié les coûts ({entity})' },
	module_added: { icon: 'BookOpen', template: 'a ajouté le module {entity}' },
	module_updated: { icon: 'BookOpen', template: 'a modifié le module {entity}' },
	module_deleted: { icon: 'BookOpen', template: 'a supprimé le module {entity}' },
	emargement_signed: { icon: 'FileSignature', template: 'a signé l\'émargement' }
} as const;
