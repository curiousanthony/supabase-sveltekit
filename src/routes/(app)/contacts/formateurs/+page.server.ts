import { db } from '$lib/db';
import type { PageServerLoad } from './$types';

const header = {
	actions: [
		{ type: 'button', icon: 'plus', text: 'Inviter un formateur', href: '/contacts/formateurs/ajouter', variant: 'default' as const },
		{ type: 'button', icon: 'search', text: 'Trouver un formateur', href: '/contacts/formateurs/rechercher', variant: 'default' as const }
	]
};

function safePayload() {
	return { formateurs: [], pageName: 'Formateurs' as const, header };
}

export const load = (async () => {
	try {
		// Prefer full query; fallback to minimal query so we never 500 (e.g. prod schema/relation mismatch)
		let formateurs: Awaited<ReturnType<typeof runFullQuery>>;
		try {
			formateurs = await runFullQuery();
		} catch {
			try {
				const minimal = await db.query.formateurs.findMany({
					with: { user: { columns: { firstName: true, lastName: true } } }
				});
				formateurs = minimal.map((f) => ({ ...f, formateursThematiques: [] as { thematique: { name: string } }[] })) as Awaited<ReturnType<typeof runFullQuery>>;
			} catch {
				return safePayload();
			}
		}
		return { formateurs, pageName: 'Formateurs', header };
	} catch (err) {
		const msg = err instanceof Error ? err.message : String(err);
		console.error('[formateurs load]', msg);
		return safePayload();
	}
}) satisfies PageServerLoad;

async function runFullQuery() {
	return db.query.formateurs.findMany({
		with: {
			user: { columns: { firstName: true, lastName: true } },
			formateursThematiques: {
				with: { thematique: { columns: { name: true } } }
			}
		}
	});
}
