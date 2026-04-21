import { eq, and, notInArray } from 'drizzle-orm';
import { db } from '$lib/db';
import { formationDocuments } from '$lib/db/schema';
import { logAuditEvent, type AuthenticatedUserId } from './audit-log';

export type DocumentType =
	| 'convention'
	| 'convocation'
	| 'feuille_emargement'
	| 'certificat'
	| 'attestation'
	| 'devis'
	| 'ordre_mission';

export type DocumentStatus =
	| 'genere'
	| 'envoye'
	| 'signatures_en_cours'
	| 'accepte'
	| 'refuse'
	| 'expire'
	| 'signe'
	| 'archive'
	| 'annule'
	| 'remplace';

const TERMINAL_STATUSES: ReadonlySet<DocumentStatus> = new Set([
	'annule',
	'remplace',
	'archive'
]);

const PRESERVED_ON_CANCEL: ReadonlySet<DocumentStatus> = new Set([
	'signe',
	'archive',
	'annule',
	'remplace'
]);

const VALID_TRANSITIONS: Record<DocumentType, Record<string, readonly DocumentStatus[]>> = {
	devis: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['accepte', 'refuse', 'archive', 'annule', 'remplace'],
		accepte: ['archive', 'annule'],
		refuse: ['archive', 'remplace'],
		expire: ['archive', 'remplace'],
		annule: [],
		remplace: [],
		archive: []
	},
	convention: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['signe', 'archive', 'annule', 'remplace'],
		signe: ['archive', 'annule'],
		annule: [],
		remplace: [],
		archive: []
	},
	ordre_mission: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['signe', 'archive', 'annule', 'remplace'],
		signe: ['archive', 'annule'],
		annule: [],
		remplace: [],
		archive: []
	},
	feuille_emargement: {
		genere: ['signatures_en_cours', 'archive', 'annule', 'remplace'],
		signatures_en_cours: ['signe', 'archive', 'annule'],
		signe: ['archive', 'annule'],
		annule: [],
		remplace: [],
		archive: []
	},
	convocation: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['archive', 'annule', 'remplace'],
		annule: [],
		remplace: [],
		archive: []
	},
	certificat: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['archive', 'annule', 'remplace'],
		annule: [],
		remplace: [],
		archive: []
	},
	attestation: {
		genere: ['envoye', 'archive', 'annule', 'remplace'],
		envoye: ['archive', 'annule', 'remplace'],
		annule: [],
		remplace: [],
		archive: []
	}
};

export function getValidTransitions(
	type: DocumentType,
	currentStatus: DocumentStatus
): readonly DocumentStatus[] {
	return VALID_TRANSITIONS[type]?.[currentStatus] ?? [];
}

export function isValidTransition(
	type: DocumentType,
	from: DocumentStatus,
	to: DocumentStatus
): boolean {
	return getValidTransitions(type, from).includes(to);
}

export function isTerminalStatus(status: DocumentStatus): boolean {
	return TERMINAL_STATUSES.has(status);
}

export function getValidStatuses(type: DocumentType): DocumentStatus[] {
	return Object.keys(VALID_TRANSITIONS[type] ?? {}) as DocumentStatus[];
}

export function isValidStatus(type: DocumentType, status: string): status is DocumentStatus {
	const validStatuses = VALID_TRANSITIONS[type];
	return validStatuses !== undefined && status in validStatuses;
}

export interface TransitionResult {
	success: boolean;
	error?: string;
}

export interface TransitionContext {
	documentId: string;
	formationId: string;
	userId: AuthenticatedUserId;
}

type DocInsert = typeof formationDocuments.$inferInsert;

const STATUS_TIMESTAMP_FIELD: Partial<Record<DocumentStatus, keyof DocInsert>> = {
	accepte: 'acceptedAt',
	refuse: 'refusedAt',
	archive: 'archivedAt',
	signe: 'signedAt',
	envoye: 'sentAt'
};

export async function transitionStatus(
	ctx: TransitionContext,
	toStatus: DocumentStatus
): Promise<TransitionResult> {
	return db.transaction(async (tx) => {
		const doc = await tx.query.formationDocuments.findFirst({
			where: and(
				eq(formationDocuments.id, ctx.documentId),
				eq(formationDocuments.formationId, ctx.formationId)
			),
			columns: { id: true, type: true, status: true }
		});

		if (!doc) {
			return { success: false, error: 'Document introuvable' };
		}

		const docType = doc.type as DocumentType;
		const fromStatus = doc.status as DocumentStatus;

		if (!isValidStatus(docType, fromStatus)) {
			return { success: false, error: `Statut actuel invalide : ${fromStatus}` };
		}

		if (!isValidTransition(docType, fromStatus, toStatus)) {
			return {
				success: false,
				error: `Transition interdite : ${fromStatus} → ${toStatus} pour ${docType}`
			};
		}

		const now = new Date().toISOString();
		const updateFields: Partial<DocInsert> = {
			status: toStatus,
			statusChangedAt: now,
			statusChangedBy: ctx.userId,
			updatedAt: now
		};

		const timestampField = STATUS_TIMESTAMP_FIELD[toStatus];
		if (timestampField) {
			(updateFields as Record<string, unknown>)[timestampField] = now;
		}

		const updated = await tx
			.update(formationDocuments)
			.set(updateFields)
			.where(
				and(
					eq(formationDocuments.id, ctx.documentId),
					eq(formationDocuments.formationId, ctx.formationId),
					eq(formationDocuments.status, fromStatus)
				)
			)
			.returning({ id: formationDocuments.id });

		if (updated.length === 0) {
			return { success: false, error: 'Transition échouée — statut modifié entre-temps' };
		}

		await logAuditEvent(
			{
				formationId: ctx.formationId,
				userId: ctx.userId,
				actionType: 'document_status_change',
				entityType: 'formation_document',
				entityId: ctx.documentId,
				fieldName: 'status',
				oldValue: fromStatus,
				newValue: toStatus
			},
			tx
		);

		return { success: true };
	});
}

export async function cancelFormationDocuments(
	formationId: string,
	userId: AuthenticatedUserId
): Promise<{ cancelled: number }> {
	return db.transaction(async (tx) => {
		const inFlightDocs = await tx.query.formationDocuments.findMany({
			where: and(
				eq(formationDocuments.formationId, formationId),
				notInArray(formationDocuments.status, [...PRESERVED_ON_CANCEL])
			),
			columns: { id: true, status: true, type: true }
		});

		const now = new Date().toISOString();

		for (const doc of inFlightDocs) {
			await tx
				.update(formationDocuments)
				.set({
					status: 'annule',
					statusChangedAt: now,
					statusChangedBy: userId,
					updatedAt: now
				})
				.where(eq(formationDocuments.id, doc.id));

			await logAuditEvent(
				{
					formationId,
					userId,
					actionType: 'document_status_change',
					entityType: 'formation_document',
					entityId: doc.id,
					fieldName: 'status',
					oldValue: doc.status,
					newValue: 'annule'
				},
				tx
			);
		}

		return { cancelled: inFlightDocs.length };
	});
}

export async function replaceDocument(
	ctx: TransitionContext,
	newDocumentId: string
): Promise<TransitionResult> {
	return db.transaction(async (tx) => {
		const oldDoc = await tx.query.formationDocuments.findFirst({
			where: and(
				eq(formationDocuments.id, ctx.documentId),
				eq(formationDocuments.formationId, ctx.formationId)
			),
			columns: { id: true, type: true, status: true }
		});

		if (!oldDoc) {
			return { success: false, error: 'Document original introuvable' };
		}

		const newDoc = await tx.query.formationDocuments.findFirst({
			where: and(
				eq(formationDocuments.id, newDocumentId),
				eq(formationDocuments.formationId, ctx.formationId)
			),
			columns: { id: true, replacesDocumentId: true }
		});

		if (!newDoc) {
			return { success: false, error: 'Nouveau document introuvable dans cette formation' };
		}

		const docType = oldDoc.type as DocumentType;
		const fromStatus = oldDoc.status as DocumentStatus;

		if (fromStatus === 'signe') {
			return {
				success: false,
				error: 'Un document signé ne peut pas être remplacé — créez un avenant'
			};
		}

		if (!isValidTransition(docType, fromStatus, 'remplace')) {
			return {
				success: false,
				error: `Remplacement interdit depuis le statut : ${fromStatus}`
			};
		}

		const now = new Date().toISOString();

		const updated = await tx
			.update(formationDocuments)
			.set({
				status: 'remplace',
				statusChangedAt: now,
				statusChangedBy: ctx.userId,
				updatedAt: now
			})
			.where(
				and(
					eq(formationDocuments.id, ctx.documentId),
					eq(formationDocuments.status, fromStatus)
				)
			)
			.returning({ id: formationDocuments.id });

		if (updated.length === 0) {
			return { success: false, error: 'Remplacement échoué — statut modifié entre-temps' };
		}

		await tx
			.update(formationDocuments)
			.set({ replacesDocumentId: ctx.documentId })
			.where(eq(formationDocuments.id, newDocumentId));

		await logAuditEvent(
			{
				formationId: ctx.formationId,
				userId: ctx.userId,
				actionType: 'document_replaced',
				entityType: 'formation_document',
				entityId: ctx.documentId,
				oldValue: fromStatus,
				newValue: 'remplace'
			},
			tx
		);

		return { success: true };
	});
}

export function computeDevisExpiry(
	status: string,
	expiresAt: string | null
): DocumentStatus | null {
	if (status === 'envoye' && expiresAt && new Date(expiresAt) < new Date()) {
		return 'expire';
	}
	return null;
}

export function getEffectiveStatus(doc: {
	type: string;
	status: string;
	expiresAt: string | null;
}): DocumentStatus {
	if (doc.type === 'devis') {
		const expiry = computeDevisExpiry(doc.status, doc.expiresAt);
		if (expiry) return expiry;
	}
	return doc.status as DocumentStatus;
}
