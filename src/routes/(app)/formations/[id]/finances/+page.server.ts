import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { formationInvoices, formationCostItems, formations } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent, authenticatedUserId } from '$lib/services/audit-log';
import { uploadInvoicePdf, deleteStorageFile } from '$lib/services/document-service';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

export const load = (async ({ params }) => {
	const invoices = await db.query.formationInvoices.findMany({
		where: eq(formationInvoices.formationId, params.id),
		orderBy: (inv, { desc }) => [desc(inv.date)]
	});

	const costItems = await db.query.formationCostItems.findMany({
		where: eq(formationCostItems.formationId, params.id)
	});

	return { invoices, costItems };
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
		const pdfFile = formData.get('pdf') as File | null;

		if (!invoiceNumber || !date || !amountRaw || !recipient || !recipientType) {
			return fail(400, { message: 'Champs obligatoires manquants' });
		}

		const amount = parseFloat(amountRaw);
		if (isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
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
			newValue: { invoiceNumber, amount, recipient }
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
		const pdfFile = formData.get('pdf') as File | null;

		if (!invoiceId || !invoiceNumber || !date || !amountRaw || !recipient || !recipientType) {
			return fail(400, { message: 'Champs obligatoires manquants' });
		}

		const amount = parseFloat(amountRaw);
		if (isNaN(amount) || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
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
			newValue: { invoiceNumber, amount, recipient, status }
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

		await db
			.delete(formationInvoices)
			.where(eq(formationInvoices.id, invoiceId));

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'invoice_deleted',
			entityType: 'formation_invoice',
			entityId: invoiceId,
			oldValue: { invoiceNumber: existing.invoiceNumber }
		});

		return { success: true };
	}
};
