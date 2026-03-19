import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	formations,
	formationCostItems,
	formationInvoices,
	formationFormateurs
} from '$lib/db/schema';
import { and, eq } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

function parseMoney(raw: FormDataEntryValue | null): number | null {
	if (raw == null || raw === '') return null;
	const n = typeof raw === 'string' ? parseFloat(raw.replace(',', '.')) : NaN;
	return Number.isFinite(n) ? n : null;
}

export const load = (async ({ params, parent }) => {
	await parent();
	const costItems = await db.query.formationCostItems.findMany({
		where: eq(formationCostItems.formationId, params.id)
	});
	const invoices = await db.query.formationInvoices.findMany({
		where: eq(formationInvoices.formationId, params.id),
		orderBy: (i, { desc }) => [desc(i.date)]
	});
	const formateurCosts = await db.query.formationFormateurs.findMany({
		where: eq(formationFormateurs.formationId, params.id),
		columns: {
			tjm: true,
			numberOfDays: true,
			deplacementCost: true,
			hebergementCost: true
		}
	});
	return { costItems, invoices, formateurCosts };
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
		const categoryRaw = formData.get('category');
		const rawAmount = formData.get('amount');
		const amount =
			rawAmount === '' || rawAmount == null ? 0 : parseMoney(rawAmount);
		const notesRaw = formData.get('notes');
		const notes =
			notesRaw != null && typeof notesRaw === 'string' && notesRaw.trim() !== ''
				? notesRaw.trim()
				: null;

		if (!categoryRaw || typeof categoryRaw !== 'string' || !categoryRaw.trim()) {
			return fail(400, { message: 'Catégorie requise' });
		}
		const category = categoryRaw.trim();
		if (amount == null || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}

		const existing = await db.query.formationCostItems.findFirst({
			where: and(
				eq(formationCostItems.formationId, params.id),
				eq(formationCostItems.category, category)
			),
			columns: { id: true, amount: true, notes: true }
		});

		const amountStr = amount.toFixed(2);
		const now = new Date().toISOString();

		await db
			.insert(formationCostItems)
			.values({
				formationId: params.id,
				category,
				amount: amountStr,
				notes,
				updatedAt: now
			})
			.onConflictDoUpdate({
				target: [formationCostItems.formationId, formationCostItems.category],
				set: {
					amount: amountStr,
					notes,
					updatedAt: now
				}
			});

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'cost_updated',
			entityType: category,
			oldValue: existing ? `${existing.amount}` : null,
			newValue: amountStr
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
		const invoiceNumber = formData.get('invoiceNumber');
		const date = formData.get('date');
		const amount = parseMoney(formData.get('amount'));
		const recipient = formData.get('recipient');
		const recipientType = formData.get('recipientType');
		const dueDate = formData.get('dueDate');
		const status = formData.get('status');
		const notesRaw = formData.get('notes');
		const notes =
			notesRaw != null && typeof notesRaw === 'string' && notesRaw.trim() !== ''
				? notesRaw.trim()
				: null;

		if (!invoiceNumber || typeof invoiceNumber !== 'string' || !invoiceNumber.trim()) {
			return fail(400, { message: 'Numéro de facture requis' });
		}
		if (!date || typeof date !== 'string') {
			return fail(400, { message: 'Date requise' });
		}
		if (amount == null || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}
		if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
			return fail(400, { message: 'Destinataire requis' });
		}
		const rt =
			recipientType === 'opco' || recipientType === 'client' ? recipientType : 'client';
		if (!status || typeof status !== 'string') {
			return fail(400, { message: 'Statut requis' });
		}
		const due =
			dueDate != null && typeof dueDate === 'string' && dueDate.trim() !== ''
				? dueDate.trim()
				: null;

		const [inserted] = await db
			.insert(formationInvoices)
			.values({
				formationId: params.id,
				invoiceNumber: invoiceNumber.trim(),
				date,
				amount: amount.toFixed(2),
				recipient: recipient.trim(),
				recipientType: rt,
				dueDate: due,
				status: status.trim(),
				notes,
				createdBy: user.id,
				updatedAt: new Date().toISOString()
			})
			.returning({ id: formationInvoices.id, invoiceNumber: formationInvoices.invoiceNumber });

		if (inserted) {
			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'invoice_created',
				entityType: 'formation_invoice',
				entityId: inserted.id,
				newValue: inserted.invoiceNumber
			});
		}

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
		const invoiceIdRaw = formData.get('invoiceId');
		if (!invoiceIdRaw || typeof invoiceIdRaw !== 'string') {
			return fail(400, { message: 'Facture requise' });
		}
		const invoiceId = invoiceIdRaw.trim();

		const existing = await db.query.formationInvoices.findFirst({
			where: and(
				eq(formationInvoices.id, invoiceId),
				eq(formationInvoices.formationId, params.id)
			),
			columns: { id: true, invoiceNumber: true }
		});
		if (!existing) {
			return fail(404, { message: 'Facture introuvable' });
		}

		const invoiceNumber = formData.get('invoiceNumber');
		const date = formData.get('date');
		const amount = parseMoney(formData.get('amount'));
		const recipient = formData.get('recipient');
		const recipientType = formData.get('recipientType');
		const dueDate = formData.get('dueDate');
		const status = formData.get('status');
		const notesRaw = formData.get('notes');
		const notes =
			notesRaw != null && typeof notesRaw === 'string' && notesRaw.trim() !== ''
				? notesRaw.trim()
				: null;

		if (!invoiceNumber || typeof invoiceNumber !== 'string' || !invoiceNumber.trim()) {
			return fail(400, { message: 'Numéro de facture requis' });
		}
		if (!date || typeof date !== 'string') {
			return fail(400, { message: 'Date requise' });
		}
		if (amount == null || amount < 0) {
			return fail(400, { message: 'Montant invalide' });
		}
		if (!recipient || typeof recipient !== 'string' || !recipient.trim()) {
			return fail(400, { message: 'Destinataire requis' });
		}
		const rt =
			recipientType === 'opco' || recipientType === 'client' ? recipientType : 'client';
		if (!status || typeof status !== 'string') {
			return fail(400, { message: 'Statut requis' });
		}
		const due =
			dueDate != null && typeof dueDate === 'string' && dueDate.trim() !== ''
				? dueDate.trim()
				: null;

		await db
			.update(formationInvoices)
			.set({
				invoiceNumber: invoiceNumber.trim(),
				date,
				amount: amount.toFixed(2),
				recipient: recipient.trim(),
				recipientType: rt,
				dueDate: due,
				status: status.trim(),
				notes,
				updatedAt: new Date().toISOString()
			})
			.where(eq(formationInvoices.id, invoiceId));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'invoice_updated',
			entityType: 'formation_invoice',
			entityId: invoiceId,
			oldValue: existing.invoiceNumber,
			newValue: invoiceNumber.trim()
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
		const invoiceIdRaw = formData.get('invoiceId');
		if (!invoiceIdRaw || typeof invoiceIdRaw !== 'string') {
			return fail(400, { message: 'Facture requise' });
		}
		const invoiceId = invoiceIdRaw.trim();

		const existing = await db.query.formationInvoices.findFirst({
			where: and(
				eq(formationInvoices.id, invoiceId),
				eq(formationInvoices.formationId, params.id)
			),
			columns: { id: true, invoiceNumber: true }
		});
		if (!existing) {
			return fail(404, { message: 'Facture introuvable' });
		}

		await db.delete(formationInvoices).where(eq(formationInvoices.id, invoiceId));

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'invoice_deleted',
			entityType: 'formation_invoice',
			entityId: invoiceId,
			oldValue: existing.invoiceNumber
		});

		return { success: true };
	}
};
