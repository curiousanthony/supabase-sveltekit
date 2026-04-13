import { db } from '$lib/db';
import { formationDocuments, formationEmails, formations, formationApprenants, workspaces } from '$lib/db/schema';
import { eq, and, desc, notInArray } from 'drizzle-orm';
import { fail } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';
import { generateDocument, getDocumentSignedUrl, type DocumentType } from '$lib/services/document-generator';
import { getEffectiveStatus, transitionStatus, replaceDocument, isValidTransition, type DocumentType as LifecycleDocType, type DocumentStatus } from '$lib/services/document-lifecycle';
import { logAuditEvent } from '$lib/services/audit-log';
import { evaluatePreflight, assertPreflightOrThrow } from '$lib/preflight/document-preflight';
import type { PageServerLoad, Actions } from './$types';

async function verifyFormationOwnership(formationId: string, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

/** Shared DB load for server-side preflight (generate + regenerate paths). */
async function loadPreflightRows(formationId: string, workspaceId: string) {
	const [formationRow, workspaceRow, apprenantRows, docRows] = await Promise.all([
		db.query.formations.findFirst({
			where: and(eq(formations.id, formationId), eq(formations.workspaceId, workspaceId)),
			columns: { id: true, clientId: true, typeFinancement: true, dateDebut: true, dateFin: true },
			with: {
				client: { columns: { id: true, type: true } },
				seances: {
					columns: { id: true, endAt: true },
					with: { emargements: { columns: { signedAt: true } } }
				}
			}
		}),
		db.query.workspaces.findFirst({
			where: eq(workspaces.id, workspaceId),
			columns: { id: true, nda: true }
		}),
		db.query.formationApprenants.findMany({
			where: eq(formationApprenants.formationId, formationId),
			with: { contact: { columns: { email: true } } }
		}),
		db.query.formationDocuments.findMany({
			where: eq(formationDocuments.formationId, formationId),
			columns: { type: true, status: true }
		})
	]);
	return { formationRow, workspaceRow, apprenantRows, docRows };
}

function evaluatePreflightForServer(
	formationRow: NonNullable<Awaited<ReturnType<typeof loadPreflightRows>>['formationRow']>,
	workspaceRow: NonNullable<Awaited<ReturnType<typeof loadPreflightRows>>['workspaceRow']>,
	apprenantRows: Awaited<ReturnType<typeof loadPreflightRows>>['apprenantRows'],
	docRows: Awaited<ReturnType<typeof loadPreflightRows>>['docRows'],
	documentType: string,
	ids: { contactId?: string; formateurId?: string; seanceId?: string }
) {
	const now = new Date().toISOString();
	const hasAcceptedDevis = docRows.some((d) => d.type === 'devis' && d.status === 'accepte');
	const hasSignedConvention = docRows.some(
		(d) => d.type === 'convention' && (d.status === 'signe' || d.status === 'archive')
	);
	const hasSignedEmargements = !(formationRow.seances ?? []).some((seance) => {
		if (!seance.endAt || seance.endAt > now) return false;
		return seance.emargements.some((e) => !e.signedAt);
	});
	const hasLearnerWithEmail = apprenantRows.some((a) => a.contact?.email);

	return evaluatePreflight(
		{
			id: formationRow.id,
			clientId: formationRow.clientId,
			clientType: formationRow.client?.type ?? null,
			typeFinancement: formationRow.typeFinancement,
			dateDebut: formationRow.dateDebut,
			dateFin: formationRow.dateFin
		},
		{ id: workspaceRow.id, nda: workspaceRow.nda },
		{
			documentType,
			contactId: ids.contactId,
			formateurId: ids.formateurId,
			seanceId: ids.seanceId,
			hasAcceptedDevis,
			hasSignedConvention,
			hasSignedEmargements,
			hasLearnerWithEmail
		}
	);
}

export const load: PageServerLoad = async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { documents: [], workspaceNda: null };

	const isOwner = await verifyFormationOwnership(params.id, workspaceId);
	if (!isOwner) return { documents: [], workspaceNda: null };

	const [workspace, documents] = await Promise.all([
		db.query.workspaces.findFirst({
			where: eq(workspaces.id, workspaceId),
			columns: { nda: true }
		}),
		db.query.formationDocuments.findMany({
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
		})
	]);

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

	return { documents: docsWithEffectiveStatus, emails, workspaceNda: workspace?.nda ?? null };
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
		const warningsAcknowledgedRaw = formData.get('warningsAcknowledged')?.toString();
		const warningsAcknowledged: string[] = warningsAcknowledgedRaw
			? warningsAcknowledgedRaw.split(',').filter(Boolean)
			: [];

		if (!type || !VALID_DOCUMENT_TYPES.includes(type as DocumentType)) {
			return fail(400, { message: 'Type de document invalide' });
		}

		// ── Server-side preflight guard ────────────────────────────────────────
		const { formationRow, workspaceRow, apprenantRows, docRows } = await loadPreflightRows(
			params.id,
			workspaceId
		);

		if (!formationRow || !workspaceRow) return fail(404, { message: 'Formation introuvable' });

		const preflightResult = evaluatePreflightForServer(
			formationRow,
			workspaceRow,
			apprenantRows,
			docRows,
			type,
			{ contactId, formateurId, seanceId }
		);

		try {
			assertPreflightOrThrow(preflightResult);
		} catch {
			const blockingIds = preflightResult.items
				.filter((i) => i.severity === 'block' || i.severity === 'prerequisite')
				.map((i) => i.id)
				.join(', ');
			return fail(400, {
				message: `Génération impossible — données manquantes : ${blockingIds}`
			});
		}

		const warnIds = preflightResult.items.filter((i) => i.severity === 'warn').map((i) => i.id);
		const warnIdSet = new Set(warnIds);
		const sanitizedWarnings = [...new Set(warningsAcknowledged)].filter((id) => warnIdSet.has(id));
		if (warnIds.length > 0) {
			const allAcked = warnIds.every((id) => sanitizedWarnings.includes(id));
			if (!allAcked) {
				return fail(400, {
					message: 'Veuillez prendre connaissance de tous les avertissements avant de générer.'
				});
			}
		}

		try {
			const result = await generateDocument(
				type as DocumentType,
				params.id,
				user.id,
				{ contactId, formateurId, seanceId }
			);

			// Audit: log if user acknowledged warnings
			if (sanitizedWarnings.length > 0) {
				await logAuditEvent({
					formationId: params.id,
					userId: user.id,
					actionType: 'document_generation_warnings_overridden',
					entityType: 'formation',
					entityId: params.id,
					newValue: { documentType: type, warningIds: sanitizedWarnings }
				});
			}

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

	regenerateAll: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		const isOwner = await verifyFormationOwnership(params.id, workspaceId);
		if (!isOwner) return fail(403, { message: 'Accès refusé' });

		const formation = await db.query.formations.findFirst({
			where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
			columns: { updatedAt: true }
		});
		if (!formation?.updatedAt) return fail(404, { message: 'Formation introuvable' });

		const { formationRow, workspaceRow, apprenantRows, docRows } = await loadPreflightRows(
			params.id,
			workspaceId
		);
		if (!formationRow || !workspaceRow) return fail(404, { message: 'Formation introuvable' });

		const SKIP_STATUSES = ['signe', 'remplace', 'archive'];
		const staleDocs = await db.query.formationDocuments.findMany({
			where: and(
				eq(formationDocuments.formationId, params.id),
				notInArray(formationDocuments.status, SKIP_STATUSES)
			),
			columns: {
				id: true,
				type: true,
				status: true,
				generatedAt: true,
				relatedContactId: true,
				relatedFormateurId: true,
				relatedSeanceId: true
			}
		});

		const formationUpdatedAt = new Date(formation.updatedAt);
		const docsToRegenerate = staleDocs.filter((doc) => {
			if (!doc.generatedAt) return false;
			return formationUpdatedAt > new Date(doc.generatedAt);
		});

		let regeneratedCount = 0;
		let skippedCount = 0;

		for (const oldDoc of docsToRegenerate) {
			const docType = oldDoc.type as DocumentType;
			if (!VALID_DOCUMENT_TYPES.includes(docType)) {
				skippedCount++;
				continue;
			}

			const fromStatus = oldDoc.status as DocumentStatus;

			const regenPreflight = evaluatePreflightForServer(
				formationRow,
				workspaceRow,
				apprenantRows,
				docRows,
				docType,
				{
					contactId: oldDoc.relatedContactId ?? undefined,
					formateurId: oldDoc.relatedFormateurId ?? undefined,
					seanceId: oldDoc.relatedSeanceId ?? undefined
				}
			);
			try {
				assertPreflightOrThrow(regenPreflight);
			} catch {
				skippedCount++;
				continue;
			}

			try {
				const newResult = await generateDocument(docType, params.id, user.id, {
					contactId: oldDoc.relatedContactId ?? undefined,
					formateurId: oldDoc.relatedFormateurId ?? undefined,
					seanceId: oldDoc.relatedSeanceId ?? undefined
				});

				if (fromStatus === 'genere') {
					await db.delete(formationDocuments).where(
						and(
							eq(formationDocuments.id, oldDoc.id),
							eq(formationDocuments.formationId, params.id),
							eq(formationDocuments.status, 'genere')
						)
					);
				} else if (isValidTransition(docType as LifecycleDocType, fromStatus, 'remplace')) {
					const replaceResult = await replaceDocument(
						{ documentId: oldDoc.id, formationId: params.id, userId: user.id },
						newResult.documentId
					);
					if (!replaceResult.success) {
						await db.delete(formationDocuments).where(eq(formationDocuments.id, newResult.documentId));
						skippedCount++;
						continue;
					}
				} else {
					await db.delete(formationDocuments).where(eq(formationDocuments.id, newResult.documentId));
					skippedCount++;
					continue;
				}

				regeneratedCount++;
			} catch (err) {
				console.error(`[regenerateAll] Failed for doc ${oldDoc.id}:`, err);
				skippedCount++;
			}
		}

		return { success: true, regeneratedCount, skippedCount };
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

		const fromStatus = oldDoc.status as DocumentStatus;
		if (fromStatus !== 'genere' && !isValidTransition(docType as LifecycleDocType, fromStatus, 'remplace')) {
			return fail(400, { message: `Régénération impossible depuis le statut : ${fromStatus}` });
		}

		const { formationRow, workspaceRow, apprenantRows, docRows } = await loadPreflightRows(
			params.id,
			workspaceId
		);
		if (!formationRow || !workspaceRow) return fail(404, { message: 'Formation introuvable' });

		const regenPreflight = evaluatePreflightForServer(
			formationRow,
			workspaceRow,
			apprenantRows,
			docRows,
			docType,
			{
				contactId: oldDoc.relatedContactId ?? undefined,
				formateurId: oldDoc.relatedFormateurId ?? undefined,
				seanceId: oldDoc.relatedSeanceId ?? undefined
			}
		);
		try {
			assertPreflightOrThrow(regenPreflight);
		} catch {
			const blockingIds = regenPreflight.items
				.filter((i) => i.severity === 'block' || i.severity === 'prerequisite')
				.map((i) => i.id)
				.join(', ');
			return fail(400, {
				message: `Régénération impossible — données manquantes : ${blockingIds}`
			});
		}

		try {
			const newResult = await generateDocument(docType, params.id, user.id, {
				contactId: oldDoc.relatedContactId ?? undefined,
				formateurId: oldDoc.relatedFormateurId ?? undefined,
				seanceId: oldDoc.relatedSeanceId ?? undefined
			});

			if (fromStatus === 'genere') {
				const deleted = await db.delete(formationDocuments).where(
					and(
						eq(formationDocuments.id, oldDoc.id),
						eq(formationDocuments.formationId, params.id),
						eq(formationDocuments.status, 'genere')
					)
				).returning({ id: formationDocuments.id });

				if (deleted.length === 0) {
					console.warn(`[regenerateDocument] genere delete missed — status changed for ${oldDoc.id}`);
				}
			} else {
				const replaceResult = await replaceDocument(
					{ documentId: oldDoc.id, formationId: params.id, userId: user.id },
					newResult.documentId
				);
				if (!replaceResult.success) {
					await db.delete(formationDocuments).where(eq(formationDocuments.id, newResult.documentId));
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
