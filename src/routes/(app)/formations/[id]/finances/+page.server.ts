import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	formationInvoices,
	formationCostItems,
	formations,
	formationFundingSources,
	fundingSourceType,
	fundingSourceStatus,
	payerType
} from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent, authenticatedUserId } from '$lib/services/audit-log';
import { uploadInvoicePdf, deleteStorageFile } from '$lib/services/document-service';
import { getFundingSummary } from '$lib/services/funding-summary';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

async function verifyFundingSourceBelongsToFormation(fundingSourceId: string, formationId: string) {
	const fs = await db.query.formationFundingSources.findFirst({
		where: and(
			eq(formationFundingSources.id, fundingSourceId),
			eq(formationFundingSources.formationId, formationId)
		),
		columns: { id: true }
	});
	return !!fs;
}

function parseAmount(raw: string | null | undefined): number | null {
	if (raw === null || raw === undefined || raw === '') return null;
	const n = parseFloat(raw);
	return Number.isFinite(n) && n >= 0 ? n : NaN;
}

const VALID_SOURCES = new Set<string>(fundingSourceType.enumValues);
const VALID_STATUSES = new Set<string>(fundingSourceStatus.enumValues);
const VALID_PAYERS = new Set<string>(payerType.enumValues);

export const load = (async ({ params }) => {
	const invoices = await db.query.formationInvoices.findMany({
		where: eq(formationInvoices.formationId, params.id),
		orderBy: (inv, { desc }) => [desc(inv.date)]
	});

	const costItems = await db.query.formationCostItems.findMany({
		where: eq(formationCostItems.formationId, params.id)
	});

	const fundingSources = await db.query.formationFundingSources.findMany({
		where: eq(formationFundingSources.formationId, params.id),
		orderBy: (fs, { asc }) => [asc(fs.createdAt)]
	});

	const formation = await db.query.formations.findFirst({
		where: eq(formations.id, params.id),
		columns: { id: true, prixConvenu: true, prixPublic: true }
	});

	// Prefer prixConvenu for the synthesis; fall back to prixPublic so the
	// reste-à-charge isn't nonsensical before Marie has signed the convention.
	const referencePrice = formation?.prixConvenu ?? formation?.prixPublic ?? null;
	const summary = getFundingSummary(fundingSources, referencePrice);

	return { invoices, costItems, fundingSources, summary };
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateCostItem: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const category = formData.get('category')?.toString();
		const amountRaw = formData.get('amount')?.toString();
		const notes = formData.get('notes')?.toString() || null;

		if (!category || !['salle', 'materiel'].includes(category)) {
			return fail(400, { message: 'Catégorie invalide' });
		}

		const amount = amountRaw ? parseFloat(amountRaw) : 0;
		if (isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}

		await db
			.insert(formationCostItems)
			.values({
				formationId: params.id,
				category,
				amount: amount.toFixed(2),
				notes
			})
			.onConflictDoUpdate({
				target: [formationCostItems.formationId, formationCostItems.category],
				set: {
					amount: amount.toFixed(2),
					notes,
					updatedAt: new Date().toISOString()
				}
			});

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'cost_item_updated',
			entityType: 'formation_cost_item',
			fieldName: category,
			newValue: amount
		});

		return { success: true };
	},

	createInvoice: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const invoiceNumber = formData.get('invoiceNumber')?.toString();
		const date = formData.get('date')?.toString();
		const amountRaw = formData.get('amount')?.toString();
		const recipient = formData.get('recipient')?.toString();
		const recipientType = formData.get('recipientType')?.toString();
		const dueDate = formData.get('dueDate')?.toString() || null;
		const status = formData.get('status')?.toString() || 'Brouillon';
		const notes = formData.get('notes')?.toString() || null;
		const fundingSourceId = formData.get('fundingSourceId')?.toString() || null;
		const pdfFile = formData.get('pdf') as File | null;

		if (!invoiceNumber || !date || !amountRaw || !recipient || !recipientType) {
			return fail(400, { message: 'Champs obligatoires manquants' });
		}

		const amount = parseFloat(amountRaw);
		if (isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}

		if (fundingSourceId && !(await verifyFundingSourceBelongsToFormation(fundingSourceId, params.id))) {
			return fail(400, { message: 'Source de financement invalide' });
		}

		const [inserted] = await db
			.insert(formationInvoices)
			.values({
				formationId: params.id,
				invoiceNumber,
				date,
				amount: amount.toFixed(2),
				recipient,
				recipientType,
				dueDate,
				status,
				notes,
				fundingSourceId,
				createdBy: user.id
			})
			.returning({ id: formationInvoices.id });

		if (pdfFile && pdfFile.size > 0) {
			try {
				const { storagePath } = await uploadInvoicePdf(pdfFile, inserted.id);
				await db
					.update(formationInvoices)
					.set({ documentUrl: storagePath })
					.where(eq(formationInvoices.id, inserted.id));
			} catch (e) {
				console.error('[Finances] PDF upload failed:', e);
			}
		}

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'invoice_created',
			entityType: 'formation_invoice',
			entityId: inserted.id,
			newValue: { invoiceNumber, amount, recipient, fundingSourceId }
		});

		return { success: true };
	},

	updateInvoice: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const invoiceId = formData.get('invoiceId')?.toString();
		const invoiceNumber = formData.get('invoiceNumber')?.toString();
		const date = formData.get('date')?.toString();
		const amountRaw = formData.get('amount')?.toString();
		const recipient = formData.get('recipient')?.toString();
		const recipientType = formData.get('recipientType')?.toString();
		const dueDate = formData.get('dueDate')?.toString() || null;
		const status = formData.get('status')?.toString() || 'Brouillon';
		const notes = formData.get('notes')?.toString() || null;
		const fundingSourceId = formData.get('fundingSourceId')?.toString() || null;
		const pdfFile = formData.get('pdf') as File | null;

		if (!invoiceId || !invoiceNumber || !date || !amountRaw || !recipient || !recipientType) {
			return fail(400, { message: 'Champs obligatoires manquants' });
		}

		const amount = parseFloat(amountRaw);
		if (isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}

		if (fundingSourceId && !(await verifyFundingSourceBelongsToFormation(fundingSourceId, params.id))) {
			return fail(400, { message: 'Source de financement invalide' });
		}

		const existing = await db.query.formationInvoices.findFirst({
			where: and(
				eq(formationInvoices.id, invoiceId),
				eq(formationInvoices.formationId, params.id)
			),
			columns: { id: true, documentUrl: true }
		});

		if (!existing) {
			return fail(404, { message: 'Facture introuvable' });
		}

		let documentUrl = existing.documentUrl;

		if (pdfFile && pdfFile.size > 0) {
			if (existing.documentUrl) {
				try {
					await deleteStorageFile('invoices', existing.documentUrl);
				} catch (e) {
					console.error('[Finances] Old PDF deletion failed:', e);
				}
			}
			try {
				const { storagePath } = await uploadInvoicePdf(pdfFile, invoiceId);
				documentUrl = storagePath;
			} catch (e) {
				console.error('[Finances] PDF upload failed:', e);
			}
		}

		await db
			.update(formationInvoices)
			.set({
				invoiceNumber,
				date,
				amount: amount.toFixed(2),
				recipient,
				recipientType,
				dueDate,
				status,
				notes,
				fundingSourceId,
				documentUrl,
				updatedAt: new Date().toISOString()
			})
			.where(eq(formationInvoices.id, invoiceId));

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'invoice_updated',
			entityType: 'formation_invoice',
			entityId: invoiceId,
			newValue: { invoiceNumber, amount, recipient, status, fundingSourceId }
		});

		return { success: true };
	},

	deleteInvoice: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const invoiceId = formData.get('invoiceId')?.toString();
		if (!invoiceId) {
			return fail(400, { message: 'ID facture manquant' });
		}

		const existing = await db.query.formationInvoices.findFirst({
			where: and(
				eq(formationInvoices.id, invoiceId),
				eq(formationInvoices.formationId, params.id)
			),
			columns: { id: true, documentUrl: true, invoiceNumber: true }
		});

		if (!existing) {
			return fail(404, { message: 'Facture introuvable' });
		}

		if (existing.documentUrl) {
			try {
				await deleteStorageFile('invoices', existing.documentUrl);
			} catch (e) {
				console.error('[Finances] PDF deletion failed:', e);
			}
		}

		await db.delete(formationInvoices).where(eq(formationInvoices.id, invoiceId));

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'invoice_deleted',
			entityType: 'formation_invoice',
			entityId: invoiceId,
			oldValue: { invoiceNumber: existing.invoiceNumber }
		});

		return { success: true };
	},

	createFundingSource: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const source = formData.get('source')?.toString();
		const payer = formData.get('payerType')?.toString() || 'apprenant';
		const status = formData.get('status')?.toString() || 'Pressenti';
		const payerLabel = formData.get('payerLabel')?.toString() || null;
		const requestedAmount = parseAmount(formData.get('requestedAmount')?.toString());
		const grantedAmount = parseAmount(formData.get('grantedAmount')?.toString());
		const decisionDate = formData.get('decisionDate')?.toString() || null;
		const expectedPaymentDate = formData.get('expectedPaymentDate')?.toString() || null;
		const dossierReference = formData.get('dossierReference')?.toString() || null;
		const notes = formData.get('notes')?.toString() || null;

		if (!source || !VALID_SOURCES.has(source)) {
			return fail(400, { message: 'Source de financement invalide' });
		}
		if (!VALID_PAYERS.has(payer)) {
			return fail(400, { message: 'Type de payeur invalide' });
		}
		if (!VALID_STATUSES.has(status)) {
			return fail(400, { message: 'Statut invalide' });
		}
		if (Number.isNaN(requestedAmount) || Number.isNaN(grantedAmount)) {
			return fail(400, { message: 'Montant invalide' });
		}

		const [inserted] = await db
			.insert(formationFundingSources)
			.values({
				formationId: params.id,
				source: source as (typeof fundingSourceType.enumValues)[number],
				payerType: payer as (typeof payerType.enumValues)[number],
				payerLabel,
				requestedAmount: requestedAmount !== null ? requestedAmount.toFixed(2) : null,
				grantedAmount: grantedAmount !== null ? grantedAmount.toFixed(2) : null,
				status: status as (typeof fundingSourceStatus.enumValues)[number],
				decisionDate,
				expectedPaymentDate,
				dossierReference,
				notes
			})
			.returning({ id: formationFundingSources.id });

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'funding_source_created',
			entityType: 'formation_funding_source',
			entityId: inserted.id,
			newValue: { source, payerType: payer, requestedAmount, grantedAmount, status }
		});

		return { success: true };
	},

	updateFundingSource: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const fundingSourceId = formData.get('fundingSourceId')?.toString();
		if (!fundingSourceId) return fail(400, { message: 'ID source manquant' });
		if (!(await verifyFundingSourceBelongsToFormation(fundingSourceId, params.id))) {
			return fail(404, { message: 'Source de financement introuvable' });
		}

		const source = formData.get('source')?.toString();
		const payer = formData.get('payerType')?.toString() || 'apprenant';
		const status = formData.get('status')?.toString() || 'Pressenti';
		const payerLabel = formData.get('payerLabel')?.toString() || null;
		const requestedAmount = parseAmount(formData.get('requestedAmount')?.toString());
		const grantedAmount = parseAmount(formData.get('grantedAmount')?.toString());
		const decisionDate = formData.get('decisionDate')?.toString() || null;
		const expectedPaymentDate = formData.get('expectedPaymentDate')?.toString() || null;
		const dossierReference = formData.get('dossierReference')?.toString() || null;
		const notes = formData.get('notes')?.toString() || null;

		if (!source || !VALID_SOURCES.has(source)) {
			return fail(400, { message: 'Source de financement invalide' });
		}
		if (!VALID_PAYERS.has(payer)) {
			return fail(400, { message: 'Type de payeur invalide' });
		}
		if (!VALID_STATUSES.has(status)) {
			return fail(400, { message: 'Statut invalide' });
		}
		if (Number.isNaN(requestedAmount) || Number.isNaN(grantedAmount)) {
			return fail(400, { message: 'Montant invalide' });
		}

		await db
			.update(formationFundingSources)
			.set({
				source: source as (typeof fundingSourceType.enumValues)[number],
				payerType: payer as (typeof payerType.enumValues)[number],
				payerLabel,
				requestedAmount: requestedAmount !== null ? requestedAmount.toFixed(2) : null,
				grantedAmount: grantedAmount !== null ? grantedAmount.toFixed(2) : null,
				status: status as (typeof fundingSourceStatus.enumValues)[number],
				decisionDate,
				expectedPaymentDate,
				dossierReference,
				notes,
				updatedAt: new Date().toISOString()
			})
			.where(eq(formationFundingSources.id, fundingSourceId));

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'funding_source_updated',
			entityType: 'formation_funding_source',
			entityId: fundingSourceId,
			newValue: { source, payerType: payer, requestedAmount, grantedAmount, status }
		});

		return { success: true };
	},

	deleteFundingSource: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const fundingSourceId = formData.get('fundingSourceId')?.toString();
		if (!fundingSourceId) return fail(400, { message: 'ID source manquant' });

		const existing = await db.query.formationFundingSources.findFirst({
			where: and(
				eq(formationFundingSources.id, fundingSourceId),
				eq(formationFundingSources.formationId, params.id)
			),
			columns: { id: true, source: true, payerType: true }
		});

		if (!existing) {
			return fail(404, { message: 'Source de financement introuvable' });
		}

		// FK on formation_invoices.funding_source_id is ON DELETE SET NULL, so
		// linked invoices are preserved (their funding link is simply cleared).
		await db
			.delete(formationFundingSources)
			.where(eq(formationFundingSources.id, fundingSourceId));

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'funding_source_deleted',
			entityType: 'formation_funding_source',
			entityId: fundingSourceId,
			oldValue: { source: existing.source, payerType: existing.payerType }
		});

		return { success: true };
	}
};
