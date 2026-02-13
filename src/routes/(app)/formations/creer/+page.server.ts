import { db } from '$lib/db';
import {
	formations,
	clients,
	modules,
	targetPublics,
	prerequisites,
	thematiques,
	libraryProgrammes,
	libraryModules
} from '$lib/db/schema';
import { eq, asc, desc, and } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { zod } from 'sveltekit-superforms/adapters';
import { formationSchema } from './schema';
import { getUserWorkspace } from '$lib/auth';
import {
	formationTargetPublics,
	formationPrerequisites
} from '$lib/db/schema';
import type { PageServerLoad, Actions } from './$types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const defaultModule = {
	title: 'Formation sans titre',
	durationHours: 7,
	objectifs: 'Objectifs du premier module',
	modaliteEvaluation: 'QCM de fin de formation' as const
};

export const load = (async ({ locals, url }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) {
		return {
			form: await superValidate(zod(formationSchema), { defaults: {} }),
			clients: [],
			prerequisites: [],
			targetPublics: [],
			topics: [],
			libraryModules: [],
			programmeFromLibrary: null,
			header: { pageName: 'Créer une formation', backButton: true, backButtonLabel: 'Formations', backButtonHref: '/formations' }
		};
	}

	const clientsData = await db.query.clients.findMany({
		where: eq(clients.workspaceId, workspaceId),
		columns: { id: true, legalName: true },
		orderBy: [asc(clients.legalName)]
	});

	const [targetPublicsData, prerequisitesData, topicsData] = await Promise.all([
		db.query.targetPublics.findMany({
			where: eq(targetPublics.workspaceId, workspaceId),
			columns: { id: true, name: true },
			orderBy: [asc(targetPublics.name)]
		}),
		db.query.prerequisites.findMany({
			where: eq(prerequisites.workspaceId, workspaceId),
			columns: { id: true, name: true },
			orderBy: [asc(prerequisites.name)]
		}),
		db.query.thematiques.findMany({
			columns: { id: true, name: true },
			orderBy: [asc(thematiques.name)]
		})
	]);

	const programmeId = url.searchParams.get('programmeId');
	let formDefaults: Parameters<typeof superValidate>[1] = {
		defaults: {
			name: 'Formation sans titre',
			clientId: '',
			duree: 7,
			modalite: 'Présentiel',
			topicId: '',
			customTopic: '',
			targetPublicIds: [],
			prerequisiteIds: [],
			customPrerequisites: [],
			modules: [defaultModule],
			suiviAssiduite: "Feuille d'émargement signée par demi-journée"
		}
	};

	let programmeFromLibrary: { name: string } | null = null;
	if (programmeId && UUID_REGEX.test(programmeId)) {
		const programme = await db.query.libraryProgrammes.findFirst({
			where: and(
				eq(libraryProgrammes.id, programmeId),
				eq(libraryProgrammes.workspaceId, workspaceId)
			),
			with: {
				targetPublics: { columns: { targetPublicId: true } },
				prerequisites: { columns: { prerequisiteId: true } },
				libraryProgrammeModules: {
					with: { libraryModule: true },
					orderBy: (pm, { asc: a }) => [a(pm.orderIndex)]
				}
			}
		});
		if (programme) {
			programmeFromLibrary = { name: programme.titre ?? 'Programme' };
			formDefaults = {
				defaults: {
					name: programme.titre,
					clientId: '',
					duree: programme.duree,
					modalite: programme.modalite,
					topicId: programme.topicId ?? '',
					customTopic: '',
					targetPublicIds: programme.targetPublics?.map((t) => t.targetPublicId) ?? [],
					prerequisiteIds: programme.prerequisites?.map((p) => p.prerequisiteId) ?? [],
					customPrerequisites: [],
					modules:
						programme.libraryProgrammeModules?.map((pm) => ({
							title: pm.libraryModule?.titre ?? 'Module',
							durationHours: Number(pm.libraryModule?.dureeHours ?? 1),
							objectifs: pm.libraryModule?.objectifsPedagogiques ?? '',
							modaliteEvaluation: pm.libraryModule?.modaliteEvaluation ?? 'QCM de fin de formation'
						})) ?? [defaultModule],
					suiviAssiduite: "Feuille d'émargement signée par demi-journée"
				}
			};
		}
	}

	const libraryModulesData = await db.query.libraryModules.findMany({
		where: eq(libraryModules.workspaceId, workspaceId),
		columns: { id: true, titre: true, dureeHours: true, objectifsPedagogiques: true, modaliteEvaluation: true },
		orderBy: (m, { asc: a }) => [a(m.titre)]
	});

	const form = await superValidate(zod(formationSchema), formDefaults);

	return {
		form,
		clients: clientsData,
		prerequisites: prerequisitesData,
		targetPublics: targetPublicsData,
		topics: topicsData,
		libraryModules: libraryModulesData,
		programmeFromLibrary,
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
		const clientId = form.data.clientId && UUID_REGEX.test(form.data.clientId) ? form.data.clientId : null;

		const maxIdResult = await db
			.select({ n: formations.idInWorkspace })
			.from(formations)
			.where(eq(formations.workspaceId, workspaceId))
			.orderBy(desc(formations.idInWorkspace))
			.limit(1);
		const nextIdInWorkspace = (maxIdResult[0]?.n ?? 0) + 1;

		const [inserted] = await db
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
				idInWorkspace: nextIdInWorkspace,
				statut: 'En attente'
			})
			.returning({ id: formations.id });

		if (!inserted) return fail(500, { message: 'Erreur lors de la création de la formation', form });

		await db.insert(modules).values(
			form.data.modules.map((m, i) => ({
				courseId: inserted.id,
				createdBy: user.id,
				name: m.title,
				durationHours: String(m.durationHours),
				orderIndex: i,
				objectifsPedagogiques: m.objectifs ?? null,
				modaliteEvaluation: m.modaliteEvaluation ?? null
			}))
		);

		for (const id of form.data.targetPublicIds) {
			if (UUID_REGEX.test(id)) {
				await db.insert(formationTargetPublics).values({ formationId: inserted.id, targetPublicId: id });
			}
		}
		for (const id of form.data.prerequisiteIds) {
			if (UUID_REGEX.test(id)) {
				await db.insert(formationPrerequisites).values({ formationId: inserted.id, prerequisiteId: id });
			}
		}

		throw redirect(303, `/formations/${inserted.id}`);
	}
};
