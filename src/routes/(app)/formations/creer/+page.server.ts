import { db } from '$lib/db';
import {
	formations,
	clients,
	modules,
	formationActions,
	formationFormateurs,
	formationApprenants,
	questSubActions,
	biblioProgrammes,
	biblioProgrammeModules
} from '$lib/db/schema';
import { eq, asc, desc, sql } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { formationSchema } from './schema';
import { getUserWorkspace } from '$lib/auth';
import { getQuestsForFormation, calculateDueDates } from '$lib/formation-quests';
import type { PageServerLoad, Actions } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			form: await superValidate(zod(formationSchema), { defaults: {} }),
			clients: [],
			prerequisites: [],
			targetPublics: [],
			topics: [],
			programmes: [],
			header: {
				pageName: 'Créer une formation',
				backButton: true,
				backButtonLabel: 'Formations',
				backButtonHref: '/formations'
			}
		};
	}

	const clientsData = await db.query.clients.findMany({
		where: eq(clients.workspaceId, workspaceId),
		columns: { id: true, legalName: true },
		orderBy: [asc(clients.legalName)]
	});

	const programmesData = await db.query.biblioProgrammes.findMany({
		where: eq(biblioProgrammes.workspaceId, workspaceId),
		columns: { id: true, titre: true, dureeHeures: true, modalite: true },
		with: {
			programmeModules: {
				with: {
					module: {
						columns: {
							id: true,
							titre: true,
							dureeHeures: true,
							objectifsPedagogiques: true
						}
					}
				},
				orderBy: (pm, { asc }) => [asc(pm.orderIndex)]
			}
		}
	});

	const mockPrerequisites = [
		{ id: 'p1', name: "Maîtrise des bases de l'informatique" },
		{ id: 'p2', name: "Connaissance d'Excel niveau débutant" },
		{ id: 'p3', name: 'Anglais technique' }
	];

	const mockTargetPublics = [
		{ id: 'tp1', name: 'Salariés en reconversion' },
		{ id: 'tp2', name: "Chefs d'entreprise" },
		{ id: 'tp3', name: "Demandeurs d'emploi" }
	];

	const mockTopics = [
		{ id: 't1', name: 'AI' },
		{ id: 't2', name: 'Bureautique' },
		{ id: 't3', name: 'Langues' },
		{ id: 't4', name: 'Management' }
	];

	const programmeId = url.searchParams.get('programme');
	let defaults: Record<string, unknown> = {
		name: 'Formation sans titre',
		clientId: '',
		duree: 7,
		modalite: 'Présentiel',
		topicId: '',
		customTopic: '',
		targetPublicIds: [],
		prerequisiteIds: [],
		customPrerequisites: [],
		formateurIds: [],
		apprenantContactIds: [],
		typeFinancement: undefined,
		montantAccorde: '',
		financementAccorde: false,
		modules: [
			{
				title: 'Formation sans titre',
				durationHours: 7,
				objectifs: 'Objectifs du premier module'
			}
		],
		evaluationMode: 'QCM de fin de formation',
		suiviAssiduite: "Feuille d'émargement signée par demi-journée"
	};

	if (programmeId && UUID_REGEX.test(programmeId)) {
		const prog = programmesData.find((p) => p.id === programmeId);
		if (prog) {
			const totalHours = prog.programmeModules.reduce(
				(sum, pm) => sum + (pm.module.dureeHeures ? Number(pm.module.dureeHeures) : 0),
				0
			);
			defaults = {
				...defaults,
				name: prog.titre,
				programmeSourceId: prog.id,
				duree: totalHours || 7,
				modalite: prog.modalite ?? 'Présentiel',
				modules: prog.programmeModules.map((pm) => ({
					title: pm.module.titre,
					durationHours: pm.module.dureeHeures ? Number(pm.module.dureeHeures) : 1,
					objectifs: pm.module.objectifsPedagogiques ?? ''
				}))
			};
		}
	}

	const form = await superValidate(zod(formationSchema), { defaults });

	return {
		form,
		clients: clientsData,
		prerequisites: mockPrerequisites,
		targetPublics: mockTargetPublics,
		topics: mockTopics,
		programmes: programmesData.map((p) => ({
			id: p.id,
			titre: p.titre,
			dureeHeures: p.dureeHeures,
			modalite: p.modalite,
			moduleCount: p.programmeModules.length
		})),
		header: {
			pageName: 'Créer une formation',
			backButton: true,
			backButtonLabel: 'Formations',
			backButtonHref: '/formations'
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(400, { message: 'Aucun workspace associé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) {
			return fail(401, { message: 'Non autorisé' });
		}

		const form = await superValidate(request, zod(formationSchema));
		if (!form.valid) {
			return fail(400, { form });
		}

		const topicId =
			form.data.topicId && UUID_REGEX.test(form.data.topicId) ? form.data.topicId : null;
		const clientId =
			form.data.clientId && UUID_REGEX.test(form.data.clientId) ? form.data.clientId : null;
		const programmeSourceId =
			form.data.programmeSourceId && UUID_REGEX.test(form.data.programmeSourceId)
				? form.data.programmeSourceId
				: null;

		const [inserted] = await db.transaction(async (tx) => {
			await tx.execute(sql`SELECT pg_advisory_xact_lock(727, hashtext(${workspaceId}))`);

			const maxIdResult = await tx
				.select({ n: formations.idInWorkspace })
				.from(formations)
				.where(eq(formations.workspaceId, workspaceId))
				.orderBy(desc(formations.idInWorkspace))
				.limit(1);
			const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

			return tx
				.insert(formations)
				.values({
					workspaceId,
					createdBy: user.id,
					name: form.data.name ?? null,
					description: form.data.description?.trim() || null,
					topicId,
					clientId,
					duree: form.data.duree,
					modalite: form.data.modalite,
					type: form.data.type ?? null,
					dateDebut: form.data.dateDebut || null,
					dateFin: form.data.dateFin || null,
					location: form.data.location?.trim() || null,
					programmeSourceId,
					idInWorkspace: nextIdInWorkspace,
					statut: 'À traiter',
					typeFinancement: form.data.typeFinancement ?? null,
					montantAccorde: form.data.montantAccorde?.trim() || null,
					financementAccorde: form.data.financementAccorde ?? false
				})
				.returning({ id: formations.id });
		});

		if (!inserted) return fail(500, { message: 'Erreur lors de la création de la formation', form });

		await db.insert(modules).values(
			form.data.modules.map((m, i) => ({
				courseId: inserted.id,
				createdBy: user.id,
				name: m.title,
				durationHours: String(m.durationHours),
				orderIndex: i
			}))
		);

		const quests = getQuestsForFormation(form.data.type ?? null, form.data.typeFinancement ?? null);
		const dueDates = calculateDueDates(
			quests,
			form.data.dateDebut,
			form.data.dateFin
		);

		for (const quest of quests) {
			const [action] = await db
				.insert(formationActions)
				.values({
					formationId: inserted.id,
					title: quest.title,
					description: quest.description,
					phase: quest.phase,
					questKey: quest.key,
					status: 'Pas commencé',
					assigneeId: user.id,
					orderIndex: quest.orderIndex,
					dueDate: dueDates.get(quest.key) ?? null
				})
				.returning({ id: formationActions.id });

			if (action && quest.subActions.length > 0) {
				await db.insert(questSubActions).values(
					quest.subActions.map((sa, i) => ({
						formationActionId: action.id,
						title: sa.title,
						orderIndex: i,
						completed: false
					}))
				);
			}
		}

		const formateurIds = form.data.formateurIds ?? [];
		if (formateurIds.length > 0) {
			await db.insert(formationFormateurs).values(
				formateurIds.map((formateurId) => ({
					formationId: inserted.id,
					formateurId
				}))
			);
		}

		const apprenantContactIds = form.data.apprenantContactIds ?? [];
		if (apprenantContactIds.length > 0) {
			await db.insert(formationApprenants).values(
				apprenantContactIds.map((contactId) => ({
					formationId: inserted.id,
					contactId
				}))
			);
		}

		throw redirect(303, `/formations/${inserted.id}`);
	}
};
