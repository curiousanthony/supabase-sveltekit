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
			oldValue: entry.oldValue !== undefined ? JSON.stringify(entry.oldValue) : null,
			newValue: entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null
		});
	} catch (e) {
		console.error('[AuditLog] Failed to log event:', e);
	}
}

export async function logFieldUpdate(
	formationId: string,
	userId: string,
	fieldName: string,
	oldValue: unknown,
	newValue: unknown,
	entityType = 'formation',
	entityId?: string
): Promise<void> {
	await logAuditEvent({
		formationId,
		userId,
		actionType: 'field_update',
		entityType,
		entityId: entityId ?? formationId,
		fieldName,
		oldValue,
		newValue
	});
}
