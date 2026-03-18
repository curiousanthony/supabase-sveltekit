import { db } from '$lib/db';
import {
	deals,
	formations,
	contacts,
	companies,
	contactCompanies,
	biblioProgrammes,
	workspacesUsers
} from '$lib/db/schema';
import { getUserWorkspace, ensureUserInPublicUsers } from '$lib/auth';
import { eq, and, sql, desc } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import { DEAL_STAGES, LOSS_REASONS } from '$lib/crm/deal-schema';
import { contactSchema, posteOptions } from '$lib/crm/contact-schema';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw redirect(303, '/deals');

	const deal = await db.query.deals.findFirst({
		where: (d, { and, eq }) => and(eq(d.id, params.id), eq(d.workspaceId, workspaceId)),
		with: {
			contact: {
				columns: {
					id: true,
					firstName: true,
					lastName: true,
					email: true,
					phone: true,
					poste: true,
					linkedinUrl: true
				},
				with: {
					contactCompanies: {
						with: {
							company: {
								columns: { id: true, name: true },
								with: { industry: { columns: { id: true, name: true } } }
							}
						}
					}
				}
			},
			company: {
				columns: { id: true, name: true },
				with: { industry: { columns: { id: true, name: true } } }
			},
			programme: {
				columns: {
					id: true,
					titre: true,
					modalite: true,
					prixPublic: true,
					dureeHeures: true,
					statut: true,
					description: true
				}
			},
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
			commercial: { columns: { id: true, firstName: true, lastName: true, email: true } },
			formation: { columns: { id: true, name: true, statut: true } }
		}
	});

	if (!deal) throw redirect(303, '/deals');

	const [contactsList, companiesList, programmesList, membersList] = await Promise.all([
		db.query.contacts.findMany({
			where: eq(contacts.workspaceId, workspaceId),
			columns: { id: true, firstName: true, lastName: true, email: true },
			with: { contactCompanies: { with: { company: { columns: { id: true, name: true } } } } }
		}),
		db.query.companies.findMany({
			where: eq(companies.workspaceId, workspaceId),
			columns: { id: true, name: true }
		}),
		db.query.biblioProgrammes.findMany({
			where: eq(biblioProgrammes.workspaceId, workspaceId),
			columns: { id: true, titre: true, modalite: true, prixPublic: true, dureeHeures: true }
		}),
		db.query.workspacesUsers.findMany({
			where: eq(workspacesUsers.workspaceId, workspaceId),
			with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } }
		})
	]);

	const header = {
		pageName: deal.name,
		backButton: true,
		backButtonLabel: 'Deals',
		backButtonHref: '/deals',
		idInWorkspace: deal.idInWorkspace,
		idPrefix: 'DL-',
		actions: [] as {
			type: 'button';
			icon: string;
			text: string;
			href?: string;
			variant: 'default' | 'outline';
		}[]
	};

	if (deal.formation) {
		header.actions.push({
			type: 'button',
			icon: 'search',
			text: 'Voir la formation',
			href: `/formations/${deal.formation.id}`,
			variant: 'default'
		});
	}

	return {
		deal,
		contacts: contactsList,
		companies: companiesList,
		programmes: programmesList,
		members: membersList.map((m) => m.user).filter(Boolean),
		header
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	updateStage: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const stage = fd.get('stage') as string;
		const lossReason = fd.get('lossReason') as string | null;
		const lossReasonDetail = fd.get('lossReasonDetail') as string | null;

		if (!stage || !DEAL_STAGES.includes(stage as (typeof DEAL_STAGES)[number])) {
			return fail(400, { message: 'Étape invalide' });
		}

		const isClosed = stage === 'Gagné' || stage === 'Perdu';
		const updateData: Record<string, any> = {
			stage,
			updatedAt: new Date().toISOString(),
			...(isClosed ? { closedAt: new Date().toISOString() } : { closedAt: null })
		};

		if (stage === 'Perdu') {
			updateData.lossReason = lossReason || null;
			updateData.lossReasonDetail = lossReasonDetail || null;
		}

		const [updated] = await db
			.update(deals)
			.set(updateData)
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, stage };
	},

	updateField: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const field = fd.get('field') as string;
		const value = fd.get('value') as string;

		const allowedFields = [
			'name',
			'description',
			'dealAmount',
			'fundedAmount',
			'isFunded',
			'fundingType',
			'fundingStatus',
			'fundingReference',
			'dealFormat',
			'intraInter',
			'desiredStartDate',
			'desiredEndDate',
			'expectedCloseDate',
			'durationHours',
			'nbApprenants',
			'probability',
			'source',
			'lossReason',
			'lossReasonDetail',
			'commercialId',
			'contactId',
			'companyId',
			'programmeId'
		];

		if (!field || !allowedFields.includes(field)) {
			return fail(400, { message: `Champ non autorisé: ${field}` });
		}

		let parsedValue: any = value;

		const numericFields = ['dealAmount', 'fundedAmount', 'durationHours', 'nbApprenants', 'probability'];
		const uuidFields = ['commercialId', 'contactId', 'companyId', 'programmeId'];
		const booleanFields = ['isFunded'];

		if (numericFields.includes(field)) {
			parsedValue = value ? (field === 'dealAmount' || field === 'fundedAmount' ? String(Number(value)) : Number(value)) : null;
		} else if (uuidFields.includes(field)) {
			parsedValue = value || null;
		} else if (booleanFields.includes(field)) {
			parsedValue = value === 'true';
		} else {
			parsedValue = value || null;
		}

		const updateObj: Record<string, any> = {
			[field]: parsedValue,
			updatedAt: new Date().toISOString()
		};

		if (field === 'dealAmount') {
			updateObj.value = parsedValue;
		}

		const [updated] = await db
			.update(deals)
			.set(updateObj)
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true, field, value: parsedValue };
	},

	updateModalities: async ({ request, params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const fd = await request.formData();
		const modalities = fd.getAll('modalities').map(String).filter(Boolean);

		const [updated] = await db
			.update(deals)
			.set({
				modalities: modalities.length > 0 ? modalities : null,
				updatedAt: new Date().toISOString()
			})
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!updated) return fail(404, { message: 'Deal introuvable' });
		return { success: true };
	},

	closeAndCreateFormation: async ({ params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const deal = await db.query.deals.findFirst({
			where: (d, { and, eq }) => and(eq(d.id, params.id), eq(d.workspaceId, workspaceId))
		});
		if (!deal) return fail(404, { message: 'Deal introuvable' });
		if (deal.formationId) return fail(400, { message: 'Une formation est déjà liée' });

		let formation: { id: string };
		try {
			formation = await db.transaction(async (tx) => {
				await tx.execute(
					sql`SELECT pg_advisory_xact_lock(727, hashtext(${workspaceId}))`
				);

				const maxIdResult = await tx
					.select({ n: formations.idInWorkspace })
					.from(formations)
					.where(eq(formations.workspaceId, workspaceId))
					.orderBy(desc(formations.idInWorkspace))
					.limit(1);
				const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

				const [inserted] = await tx
					.insert(formations)
					.values({
						workspaceId,
						createdBy: user.id,
						name: deal.name,
						description: deal.description ?? undefined,
						clientId: deal.clientId ?? undefined,
						statut: 'À traiter',
						modalite: (deal.modalities?.[0] as any) ?? 'Présentiel',
						duree: deal.durationHours ?? 14,
						idInWorkspace: nextIdInWorkspace
					})
					.returning({ id: formations.id });

				if (!inserted) throw new Error('Erreur création formation');

				await tx
					.update(deals)
					.set({
						stage: 'Gagné',
						closedAt: new Date().toISOString(),
						formationId: inserted.id,
						updatedAt: new Date().toISOString()
					})
					.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)));

				return inserted;
			});
		} catch {
			return fail(500, { message: 'Erreur création formation' });
		}

		throw redirect(303, `/formations/${formation.id}`);
	},

	createContact: async ({ request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun espace de travail' });

		const fd = await request.formData();
		const raw = {
			firstName: (fd.get('firstName') as string)?.trim() ?? '',
			lastName: (fd.get('lastName') as string)?.trim() ?? '',
			email: (fd.get('email') as string)?.trim() ?? '',
			phone: (fd.get('phone') as string)?.trim() || undefined,
			poste: (fd.get('poste') as string) || undefined,
			linkedinUrl: (fd.get('linkedinUrl') as string)?.trim() || undefined,
			internalNotes: (fd.get('internalNotes') as string)?.trim() || undefined,
			companyIds: fd.getAll('companyIds').filter((v): v is string => typeof v === 'string')
		};

		const parsed = contactSchema.safeParse(raw);
		if (!parsed.success) {
			return fail(400, { message: parsed.error.errors.map((e) => e.message).join(' ') });
		}
		const poste = parsed.data.poste?.trim();
		if (poste && !posteOptions.includes(poste as (typeof posteOptions)[number])) {
			return fail(400, { message: 'Poste invalide' });
		}

		await ensureUserInPublicUsers(locals);

		try {
			const inserted = await db
				.insert(contacts)
				.values({
					workspaceId,
					firstName: parsed.data.firstName,
					lastName: parsed.data.lastName,
					email: parsed.data.email,
					phone: parsed.data.phone ?? null,
					poste: poste ? (poste as (typeof posteOptions)[number]) : null,
					linkedinUrl: parsed.data.linkedinUrl ?? null,
					internalNotes: parsed.data.internalNotes ?? null,
					createdBy: user.id
				})
				.returning({ id: contacts.id });

			const contactId = inserted[0]?.id;
			if (!contactId) return fail(500, { message: 'Création du contact échouée' });

			const allCompanyIds = [...parsed.data.companyIds];
			const newCompanyName = (fd.get('newCompanyName') as string)?.trim();
			if (newCompanyName) {
				const [newCo] = await db
					.insert(companies)
					.values({ workspaceId, name: newCompanyName })
					.returning({ id: companies.id });
				if (newCo?.id) allCompanyIds.push(newCo.id);
			}

			if (allCompanyIds.length > 0) {
				await db
					.insert(contactCompanies)
					.values(allCompanyIds.map((companyId) => ({ contactId, companyId })));
			}
			return { success: true };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			console.error('[CRM createContact from deal detail]', message);
			return fail(500, { message: 'Impossible de créer le contact.' });
		}
	},

	deleteDeal: async ({ params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace' });

		const [deleted] = await db
			.delete(deals)
			.where(and(eq(deals.id, params.id), eq(deals.workspaceId, workspaceId)))
			.returning({ id: deals.id });

		if (!deleted) return fail(404, { message: 'Deal introuvable' });
		throw redirect(303, '/deals');
	}
};
