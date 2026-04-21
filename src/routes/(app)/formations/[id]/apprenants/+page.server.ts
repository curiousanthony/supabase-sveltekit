import { fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import {
	formations,
	formationApprenants,
	contacts,
	contactCompanies,
	companies,
	emargements,
	seances
} from '$lib/db/schema';
import { eq, and, gt, isNull, inArray, asc } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import { ensureUserInPublicUsers } from '$lib/auth';
import { logAuditEvent, authenticatedUserId } from '$lib/services/audit-log';
import { posteOptions } from '$lib/crm/contact-schema';
import type { PageServerLoad, Actions } from './$types';

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

async function getFutureSeanceIds(formationId: string): Promise<string[]> {
	const now = new Date().toISOString();
	const futureSeances = await db.query.seances.findMany({
		where: and(eq(seances.formationId, formationId), gt(seances.startAt, now)),
		columns: { id: true }
	});
	return futureSeances.map((s) => s.id);
}

async function createEmargementsForSeances(seanceIds: string[], contactId: string) {
	if (seanceIds.length === 0) return;
	await db
		.insert(emargements)
		.values(seanceIds.map((seanceId) => ({ seanceId, contactId })))
		.onConflictDoNothing();
}

export const load = (async ({ locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { workspaceContacts: [], workspaceCompanies: [] };

	const [workspaceContacts, workspaceCompanies] = await Promise.all([
		db.query.contacts.findMany({
			where: eq(contacts.workspaceId, workspaceId),
			columns: { id: true, firstName: true, lastName: true, email: true, phone: true },
			with: {
				contactCompanies: {
					with: { company: { columns: { id: true, name: true } } },
					limit: 1
				}
			},
			limit: 500
		}),
		db.query.companies.findMany({
			where: eq(companies.workspaceId, workspaceId),
			columns: { id: true, name: true },
			orderBy: [asc(companies.name)],
			limit: 300
		})
	]);

	return { workspaceContacts, workspaceCompanies };
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
		const contactId = formData.get('contactId');
		if (!contactId || typeof contactId !== 'string') {
			return fail(400, { message: 'Contact requis' });
		}

		const addToFutureSessions = formData.get('addToFutureSessions') === 'true';

		try {
			await db.insert(formationApprenants).values({
				formationId: params.id,
				contactId
			});

			if (addToFutureSessions) {
				const futureIds = await getFutureSeanceIds(params.id);
				await createEmargementsForSeances(futureIds, contactId);
			}

		await logAuditEvent({
			formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'apprenant_added',
			entityType: 'formation_apprenant',
			entityId: contactId
		});
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Cet apprenant est déjà inscrit' });
			}
			throw e;
		}

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
		const contactId = formData.get('contactId');
		if (!contactId || typeof contactId !== 'string') {
			return fail(400, { message: 'Contact requis' });
		}

		const futureSeanceIds = await getFutureSeanceIds(params.id);

		await db.transaction(async (tx) => {
			if (futureSeanceIds.length > 0) {
				await tx
					.delete(emargements)
					.where(
						and(
							eq(emargements.contactId, contactId),
							inArray(emargements.seanceId, futureSeanceIds),
							isNull(emargements.signedAt)
						)
					);
			}

			await tx
				.delete(formationApprenants)
				.where(
					and(
						eq(formationApprenants.formationId, params.id),
						eq(formationApprenants.contactId, contactId)
					)
				);
		});

		await logAuditEvent({
			formationId: params.id,
		userId: authenticatedUserId(user.id),
		actionType: 'apprenant_removed',
			entityType: 'formation_apprenant',
			entityId: contactId
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
		const firstName = (formData.get('firstName') as string)?.trim() || null;
		const lastName = (formData.get('lastName') as string)?.trim() || null;
		const email = (formData.get('email') as string)?.trim() || null;
		const phone = (formData.get('phone') as string)?.trim() || null;
		const posteRaw = (formData.get('poste') as string)?.trim() || null;
		const existingCompanyId = (formData.get('companyId') as string)?.trim() || null;
		const newCompanyName = (formData.get('newCompanyName') as string)?.trim() || null;
		const addToFutureSessions = formData.get('addToFutureSessions') === 'true';

		if (!firstName && !lastName) {
			return fail(400, { message: 'Le prénom ou le nom est requis' });
		}

		const poste = posteRaw && posteOptions.includes(posteRaw as (typeof posteOptions)[number])
			? (posteRaw as (typeof posteOptions)[number])
			: null;

		try {
			const [newContact] = await db
				.insert(contacts)
				.values({ workspaceId, firstName, lastName, email, phone, poste, createdBy: user.id })
				.returning({ id: contacts.id });

			// Link company: existing or create new
			const companyIdsToLink: string[] = [];
			if (existingCompanyId) {
				companyIdsToLink.push(existingCompanyId);
			} else if (newCompanyName) {
				const [newCo] = await db
					.insert(companies)
					.values({ workspaceId, name: newCompanyName })
					.returning({ id: companies.id });
				if (newCo?.id) companyIdsToLink.push(newCo.id);
			}
			if (companyIdsToLink.length > 0) {
				await db
					.insert(contactCompanies)
					.values(companyIdsToLink.map((companyId) => ({ contactId: newContact.id, companyId })))
					.onConflictDoNothing();
			}

			await db.insert(formationApprenants).values({
				formationId: params.id,
				contactId: newContact.id
			});

			if (addToFutureSessions) {
				const futureIds = await getFutureSeanceIds(params.id);
				await createEmargementsForSeances(futureIds, newContact.id);
			}

			await logAuditEvent({
				formationId: params.id,
			userId: authenticatedUserId(user.id),
			actionType: 'contact_created_and_apprenant_added',
				entityType: 'contact',
				entityId: newContact.id
			});
		} catch (e: unknown) {
			if (e && typeof e === 'object' && 'code' in e && e.code === '23505') {
				return fail(409, { message: 'Un contact avec cet email existe déjà' });
			}
			throw e;
		}

		return { success: true };
	}
};
