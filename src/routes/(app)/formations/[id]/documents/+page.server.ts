import { db } from '$lib/db';
import { formationDocuments, formationEmails, formations } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { generateDocument, getDocumentSignedUrl, type DocumentType } from '$lib/services/document-generator';
import { getEffectiveStatus, transitionStatus, replaceDocument } from '$lib/services/document-lifecycle';
import type { PageServerLoad, Actions } from './$types';

async function verifyFormationOwnership(formationId: string, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { documents: [] };

	const isOwner = await verifyFormationOwnership(params.id, workspaceId);
	if (!isOwner) return { documents: [] };

	const documents = await db.query.formationDocuments.findMany({
		where: eq(formationDocuments.formationId, params.id),
		orderBy: [desc(formationDocuments.createdAt)],
		with: {
			generatedByUser: {
				columns: { firstName: true, lastName: true }
			},
			relatedContact: {
				columns: { firstName: true, lastName: true }
			},
			relatedFormateur: {
				columns: { id: true },
				with: {
					user: { columns: { firstName: true, lastName: true } }
				}
			}
		}
	});

	const emails = await db.query.formationEmails.findMany({
		where: eq(formationEmails.formationId, params.id),
		orderBy: [desc(formationEmails.createdAt)],
		with: {
			createdByUser: {
				columns: { firstName: true, lastName: true }
			}
		}
	});

	const docsWithEffectiveStatus = documents.map((doc) => ({
		...doc,
		effectiveStatus: getEffectiveStatus({
			type: doc.type,
			status: doc.status,
			expiresAt: doc.expiresAt
		})
	}));

	return { documents: docsWithEffectiveStatus, emails };
};

const VALID_DOCUMENT_TYPES: DocumentType[] = [
	'convention',
	'convocation',
	'feuille_emargement',
	'certificat',
	'attestation',
	'devis',
	'ordre_mission'
];

export const actions: Actions = {
	generateDocument: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const type = formData.get('type')?.toString();
		const contactId = formData.get('contactId')?.toString() || undefined;
		const formateurId = formData.get('formateurId')?.toString() || undefined;
		const seanceId = formData.get('seanceId')?.toString() || undefined;

		if (!type || !VALID_DOCUMENT_TYPES.includes(type as DocumentType)) {
			return fail(400, { message: 'Type de document invalide' });
		}

		try {
			const result = await generateDocument(
				type as DocumentType,
				params.id,
				user.id,
				{ contactId, formateurId, seanceId }
			);
			return { success: true, documentId: result.documentId };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur de génération';
			console.error(`[generateDocument] type=${type} formationId=${params.id} error:`, err);
			return fail(500, { message });
		}
	},

	getSignedUrl: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		const doc = await db.query.formationDocuments.findFirst({
			where: and(
				eq(formationDocuments.id, documentId),
				eq(formationDocuments.formationId, params.id)
			),
			columns: { storagePath: true }
		});

		if (!doc?.storagePath) return fail(404, { message: 'Document introuvable' });

		try {
			const url = await getDocumentSignedUrl(doc.storagePath);
			return { success: true, url };
		} catch {
			return fail(500, { message: 'Impossible de générer le lien' });
		}
	},

	deleteDocument: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		await db.delete(formationDocuments).where(
			and(
				eq(formationDocuments.id, documentId),
				eq(formationDocuments.formationId, params.id)
			)
		);

		return { success: true };
	},

	acceptDevis: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		const result = await transitionStatus(
			{ documentId, formationId: params.id, userId: user.id },
			'accepte'
		);

		if (!result.success) {
			return fail(400, { message: result.error ?? 'Transition impossible' });
		}

		return { success: true };
	},

	refuseDevis: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		const result = await transitionStatus(
			{ documentId, formationId: params.id, userId: user.id },
			'refuse'
		);

		if (!result.success) {
			return fail(400, { message: result.error ?? 'Transition impossible' });
		}

		return { success: true };
	},

	markAsSent: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		const result = await transitionStatus(
			{ documentId, formationId: params.id, userId: user.id },
			'envoye'
		);

		if (!result.success) {
			return fail(400, { message: result.error ?? 'Transition impossible' });
		}

		return { success: true };
	},

	regenerateDocument: async ({ request, params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formData = await request.formData();
		const documentId = formData.get('documentId')?.toString();
		if (!documentId) return fail(400, { message: 'Document ID manquant' });

		const oldDoc = await db.query.formationDocuments.findFirst({
			where: and(
				eq(formationDocuments.id, documentId),
				eq(formationDocuments.formationId, params.id)
			),
			columns: {
				id: true,
				type: true,
				status: true,
				relatedContactId: true,
				relatedFormateurId: true,
				relatedSeanceId: true
			}
		});

		if (!oldDoc) return fail(404, { message: 'Document introuvable' });

		if (oldDoc.status === 'signe') {
			return fail(400, {
				message: 'Un document signé ne peut pas être régénéré — créez un avenant'
			});
		}

		const docType = oldDoc.type as DocumentType;
		if (!VALID_DOCUMENT_TYPES.includes(docType)) {
			return fail(400, { message: 'Type de document invalide pour la régénération' });
		}

		try {
			const newResult = await generateDocument(docType, params.id, user.id, {
				contactId: oldDoc.relatedContactId ?? undefined,
				formateurId: oldDoc.relatedFormateurId ?? undefined,
				seanceId: oldDoc.relatedSeanceId ?? undefined
			});

			if (oldDoc.status === 'genere') {
				await db.delete(formationDocuments).where(
					and(
						eq(formationDocuments.id, oldDoc.id),
						eq(formationDocuments.formationId, params.id)
					)
				);
			} else {
				const replaceResult = await replaceDocument(
					{ documentId: oldDoc.id, formationId: params.id, userId: user.id },
					newResult.documentId
				);
				if (!replaceResult.success) {
					return fail(400, { message: replaceResult.error ?? 'Échec du remplacement' });
				}
			}

			return { success: true, documentId: newResult.documentId };
		} catch (err) {
			const message = err instanceof Error ? err.message : 'Erreur de régénération';
			console.error(`[regenerateDocument] docId=${documentId} formationId=${params.id} error:`, err);
			return fail(500, { message });
		}
	}
};
