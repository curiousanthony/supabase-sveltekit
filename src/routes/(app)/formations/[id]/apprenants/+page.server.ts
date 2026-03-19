import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	formations,
	formationApprenants,
	contacts,
	emargements,
	seances
} from '$lib/db/schema';
import { and, eq, inArray, gt } from 'drizzle-orm';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { logAuditEvent } from '$lib/services/audit-log';
import { validateContactName } from '$lib/crm/contact-schema';
import type { Actions, PageServerLoad } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

function parseSessionIdsJson(raw: unknown): string[] | null {
	if (raw == null || raw === '') return [];
	if (typeof raw !== 'string') return null;
	try {
		const parsed = JSON.parse(raw) as unknown;
		if (!Array.isArray(parsed)) return null;
		if (!parsed.every((x) => typeof x === 'string' && x.length > 0)) return null;
		return parsed;
	} catch {
		return null;
	}
}

async function assertFutureSessionsForFormation(
	formationId: string,
	sessionIds: string[],
	nowIso: string
): Promise<string[] | null> {
	const uniqueIds = [...new Set(sessionIds)];
	if (uniqueIds.length === 0) return [];
	const rows = await db.query.seances.findMany({
		where: and(
			eq(seances.formationId, formationId),
			inArray(seances.id, uniqueIds),
			gt(seances.startAt, nowIso)
		),
		columns: { id: true }
	});
	if (rows.length !== uniqueIds.length) return null;
	return rows.map((r) => r.id);
}

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { availableContacts: [] };

	const existingIds = (
		await db.query.formationApprenants.findMany({
			where: eq(formationApprenants.formationId, params.id),
			columns: { contactId: true }
		})
	).map((fa) => fa.contactId);

	const allContacts = await db.query.contacts.findMany({
		where: eq(contacts.workspaceId, workspaceId),
		columns: { id: true, firstName: true, lastName: true, email: true, phone: true }
	});

	const availableContacts = allContacts.filter((c) => !existingIds.includes(c.id));
	return { availableContacts };
}) satisfies PageServerLoad;

export const actions: Actions = {
	addLearner: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const contactIdRaw = formData.get('contactId');
		const futureSessionsRaw = formData.get('futureSessions');

		if (typeof contactIdRaw !== 'string' || contactIdRaw.trim() === '') {
			return fail(400, { message: 'Contact requis' });
		}
		const contactId = contactIdRaw.trim();

		const sessionIds = parseSessionIdsJson(futureSessionsRaw);
		if (sessionIds === null) {
			return fail(400, { message: 'Liste de séances invalide' });
		}

		const contact = await db.query.contacts.findFirst({
			where: and(eq(contacts.id, contactId), eq(contacts.workspaceId, workspaceId)),
			columns: { id: true, firstName: true, lastName: true }
		});
		if (!contact) {
			return fail(404, { message: 'Contact introuvable' });
		}

		const already = await db.query.formationApprenants.findFirst({
			where: and(
				eq(formationApprenants.formationId, params.id),
				eq(formationApprenants.contactId, contactId)
			),
			columns: { id: true }
		});
		if (already) {
			return fail(409, { message: 'Ce contact est déjà inscrit' });
		}

		const nowIso = new Date().toISOString();
		const validSessionIds = await assertFutureSessionsForFormation(
			params.id,
			sessionIds,
			nowIso
		);
		if (validSessionIds === null) {
			return fail(400, { message: 'Séances invalides ou passées' });
		}

		try {
			await db.insert(formationApprenants).values({
				formationId: params.id,
				contactId
			});

			if (validSessionIds.length > 0) {
				await db.insert(emargements).values(
					validSessionIds.map((seanceId) => ({
						seanceId,
						contactId
					}))
				);
			}
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Ce contact est déjà inscrit' });
			}
			throw e;
		}

		const displayName =
			[contact.firstName, contact.lastName].filter(Boolean).join(' ').trim() || contactId;

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'learner_added',
			entityType: 'contact',
			entityId: contactId,
			newValue: displayName
		});

		return { success: true };
	},

	removeLearner: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const contactIdRaw = formData.get('contactId');
		if (typeof contactIdRaw !== 'string' || contactIdRaw.trim() === '') {
			return fail(400, { message: 'Contact requis' });
		}
		const contactId = contactIdRaw.trim();

		const fa = await db.query.formationApprenants.findFirst({
			where: and(
				eq(formationApprenants.formationId, params.id),
				eq(formationApprenants.contactId, contactId)
			),
			columns: { id: true },
			with: {
				contact: { columns: { firstName: true, lastName: true } }
			}
		});
		if (!fa) {
			return fail(404, { message: 'Apprenant non trouvé' });
		}

		const nowIso = new Date().toISOString();

		const futureSeanceRows = await db
			.select({ id: seances.id })
			.from(seances)
			.where(and(eq(seances.formationId, params.id), gt(seances.startAt, nowIso)));

		const futureSeanceIds = futureSeanceRows.map((r) => r.id);
		if (futureSeanceIds.length > 0) {
			await db
				.delete(emargements)
				.where(
					and(
						eq(emargements.contactId, contactId),
						inArray(emargements.seanceId, futureSeanceIds)
					)
				);
		}

		const removed = await db
			.delete(formationApprenants)
			.where(
				and(
					eq(formationApprenants.formationId, params.id),
					eq(formationApprenants.contactId, contactId)
				)
			)
			.returning({ id: formationApprenants.id });

		if (removed.length === 0) {
			return fail(404, { message: 'Apprenant non trouvé' });
		}

		const displayName =
			[fa.contact?.firstName, fa.contact?.lastName].filter(Boolean).join(' ').trim() ||
			contactId;

		await logAuditEvent({
			formationId: params.id,
			userId: user.id,
			actionType: 'learner_removed',
			entityType: 'contact',
			entityId: contactId,
			oldValue: displayName
		});

		return { success: true };
	},

	createContact: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		await ensureUserInPublicUsers(locals);

		const formData = await request.formData();
		const fnRaw = formData.get('firstName');
		const lnRaw = formData.get('lastName');
		const emRaw = formData.get('email');
		const phRaw = formData.get('phone');
		const firstName = typeof fnRaw === 'string' ? fnRaw.trim() : '';
		const lastName = typeof lnRaw === 'string' ? lnRaw.trim() : '';
		const emailRaw = typeof emRaw === 'string' ? emRaw.trim() : '';
		const phoneRaw = typeof phRaw === 'string' ? phRaw.trim() : '';
		const futureSessionsRaw = formData.get('futureSessions');

		const fnErr = validateContactName(firstName, { requiredMessage: 'Le prénom est requis' });
		if (fnErr) return fail(400, { message: fnErr });
		const lnErr = validateContactName(lastName, { requiredMessage: 'Le nom est requis' });
		if (lnErr) return fail(400, { message: lnErr });

		const email = emailRaw === '' ? null : emailRaw;
		if (email) {
			const { z } = await import('zod');
			const parsed = z.string().email('Email invalide').safeParse(email);
			if (!parsed.success) {
				return fail(400, { message: parsed.error.errors[0]?.message ?? 'Email invalide' });
			}
		}

		const phone = phoneRaw === '' ? null : phoneRaw;

		const sessionIds = parseSessionIdsJson(futureSessionsRaw);
		if (sessionIds === null) {
			return fail(400, { message: 'Liste de séances invalide' });
		}

		const nowIso = new Date().toISOString();
		const validSessionIds = await assertFutureSessionsForFormation(
			params.id,
			sessionIds,
			nowIso
		);
		if (validSessionIds === null) {
			return fail(400, { message: 'Séances invalides ou passées' });
		}

		try {
			const contactId = await db.transaction(async (tx) => {
				const [inserted] = await tx
					.insert(contacts)
					.values({
						workspaceId,
						firstName,
						lastName,
						email,
						phone,
						createdBy: user.id
					})
					.returning({ id: contacts.id });

				const newId = inserted?.id;
				if (!newId) {
					throw new Error('insert_failed');
				}

				await tx.insert(formationApprenants).values({
					formationId: params.id,
					contactId: newId
				});

				if (validSessionIds.length > 0) {
					await tx.insert(emargements).values(
						validSessionIds.map((seanceId) => ({
							seanceId,
							contactId: newId
						}))
					);
				}

				return newId;
			});

			const displayName = [firstName, lastName].filter(Boolean).join(' ').trim() || contactId;

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'learner_added',
				entityType: 'contact',
				entityId: contactId,
				newValue: displayName
			});

			return { success: true };
		} catch (e: unknown) {
			if (e instanceof Error && e.message === 'insert_failed') {
				return fail(500, { message: 'Échec de la création du contact' });
			}
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Un contact avec cet email existe déjà' });
			}
			throw e;
		}
	}
};
