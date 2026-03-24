import { db } from '$lib/db';
import { formateurs } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { createFormateurForWorkspace } from '$lib/services/formateur-create';
import type { PageServerLoad, Actions } from './$types';

const header = {
	pageName: 'Formateurs',
	actions: [
		{
			type: 'button',
			icon: 'plus',
			text: 'Nouveau formateur',
			href: '/contacts/formateurs?new=1',
			variant: 'default' as const
		}
	]
};

function safePayload() {
	return { formateurs: [], pageName: 'Formateurs' as const, header, openNewModal: false };
}

export const load = (async ({ url, locals }) => {
	const openNewModal = url.searchParams.has('new');
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) return { ...safePayload(), openNewModal };
	try {
		let formateursList: Awaited<ReturnType<typeof runFullQuery>>;
		try {
			formateursList = await runFullQuery(workspaceId);
		} catch {
			try {
				const minimal = await db.query.formateurs.findMany({
					where: eq(formateurs.workspaceId, workspaceId),
					with: { user: { columns: { firstName: true, lastName: true } } }
				});
				formateursList = minimal.map((f) => ({
					...f,
					formateursThematiques: [] as { thematique: { name: string } }[]
				})) as Awaited<ReturnType<typeof runFullQuery>>;
			} catch {
				return { ...safePayload(), openNewModal };
			}
		}
		return { formateurs: formateursList, pageName: 'Formateurs', header, openNewModal };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[formateurs load]', msg);
		return { ...safePayload(), openNewModal };
	}
}) satisfies PageServerLoad;

async function runFullQuery(workspaceId: string) {
	return db.query.formateurs.findMany({
		where: eq(formateurs.workspaceId, workspaceId),
		with: {
			user: { columns: { firstName: true, lastName: true } },
			formateursThematiques: {
				with: { thematique: { columns: { name: true } } }
			}
		}
	});
}

export const actions: Actions = {
	createFormateur: async ({ request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Espace de travail non trouvé' });

		const fd = await request.formData();
		const firstName = (fd.get('firstName') as string)?.trim() || null;
		const lastName = (fd.get('lastName') as string)?.trim() || null;
		const email = (fd.get('email') as string)?.trim() || null;
		const ville = (fd.get('ville') as string)?.trim() || null;
		const departement = (fd.get('departement') as string)?.trim() || null;

		if (!firstName && !lastName) {
			return fail(400, { message: 'Le prénom ou le nom est requis' });
		}

		try {
			const { formateurId } = await createFormateurForWorkspace({
				workspaceId,
				firstName,
				lastName,
				email,
				ville,
				departement
			});
			throw redirect(303, `/contacts/formateurs/${formateurId}`);
		} catch (e) {
			if (e && typeof e === 'object' && 'status' in e && 'location' in e) throw e;
			console.error('[createFormateur]', e instanceof Error ? e.message : String(e));
			return fail(500, { message: 'Impossible de créer le formateur. Veuillez réessayer.' });
		}
	}
};
