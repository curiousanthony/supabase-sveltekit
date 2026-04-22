/**
 * Audit-log service for formation_audit_log table.
 *
 * SECURITY INVARIANT: `userId` / `AuthenticatedUserId` MUST always originate
 * from `locals.safeGetSession()` on the server side. It must NEVER be read
 * from FormData, URL params, request body, or any other client-supplied source.
 * The `AuthenticatedUserId` branded type enforces this at the TypeScript level:
 * only values minted via `authenticatedUserId(session.user.id)` are accepted.
 */
import { db } from '$lib/db';
import { formationAuditLog } from '$lib/db/schema';

export type DbClient = Pick<typeof db, 'insert'>;

/**
 * Branded type representing a user id sourced from a verified server-side
 * SvelteKit session (locals.safeGetSession()). The brand prevents callers
 * from accidentally passing user-controllable strings (FormData, URL params,
 * request body) where an authenticated user id is required.
 *
 * Mint with `authenticatedUserId(session.user.id)` from server load/action code.
 */
export type AuthenticatedUserId = string & { readonly __brand: 'AuthenticatedUserId' };

/**
 * Brand a string as an AuthenticatedUserId. Call ONLY with `user.id` returned
 * by `locals.safeGetSession()` (or equivalent server-trusted session source).
 * Never call with FormData / URL / request-body values.
 */
export function authenticatedUserId(userId: string): AuthenticatedUserId {
	return userId as AuthenticatedUserId;
}

export interface AuditEntry {
	formationId: string;
	userId: AuthenticatedUserId;
	actionType: string;
	entityType?: string;
	entityId?: string;
	fieldName?: string;
	oldValue?: unknown;
	newValue?: unknown;
}

export async function logAuditEvent(entry: AuditEntry, client?: DbClient): Promise<void> {
	const target = client ?? db;
	const values = {
		formationId: entry.formationId,
		userId: entry.userId,
		actionType: entry.actionType,
		entityType: entry.entityType ?? null,
		entityId: entry.entityId ?? null,
		fieldName: entry.fieldName ?? null,
		oldValue: entry.oldValue !== undefined ? JSON.stringify(entry.oldValue) : null,
		newValue: entry.newValue !== undefined ? JSON.stringify(entry.newValue) : null
	};

	if (client) {
		await target.insert(formationAuditLog).values(values);
		return;
	}

	try {
		await target.insert(formationAuditLog).values(values);
	} catch (e) {
		console.error('[AuditLog] Failed to log event:', e);
	}
}

export async function logFieldUpdate(
	formationId: string,
	userId: AuthenticatedUserId,
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
