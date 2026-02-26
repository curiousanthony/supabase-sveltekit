import { db } from '$lib/db';
import { formateurs, users } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const header = {
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
		const emailRaw = (fd.get('email') as string)?.trim();
		const ville = (fd.get('ville') as string)?.trim() || null;
		const departement = (fd.get('departement') as string)?.trim() || null;

		if (!firstName && !lastName) {
			return fail(400, { message: 'Le prénom ou le nom est requis' });
		}

		// Use a generated placeholder email if none provided so users.email NOT NULL is satisfied
		const email = emailRaw || `formateur.${Date.now()}@noreply.internal`;

		let newUserId: string;
		try {
			const [newUser] = await db
				.insert(users)
				.values({ firstName, lastName, email })
				.returning({ id: users.id });
			newUserId = newUser.id;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(409, { message: 'Cet email est déjà associé à un profil existant' });
			}
			throw e;
		}

		let newFormateur: { id: string };
		try {
			const [row] = await db
				.insert(formateurs)
				.values({ userId: newUserId, workspaceId, ville, departement })
				.returning({ id: formateurs.id });
			if (!row) throw new Error('Insert returned no row');
			newFormateur = row;
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (
				msg.includes('workspace_id') ||
				(msg.includes('column') && msg.includes('does not exist')) ||
				msg.includes('42703')
			) {
				return fail(503, {
					message:
						'La base de données doit être mise à jour (migration formateurs). Contactez l’administrateur.'
				});
			}
			return fail(500, {
				message: 'Impossible de créer le formateur. Veuillez réessayer ou contacter l’administrateur.'
			});
		}

		throw redirect(303, `/contacts/formateurs/${newFormateur.id}`);
	}
};
