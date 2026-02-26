import { db } from '$lib/db';
import { formateurs, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

const FORMATEUR_FIELDS = [
	'tauxHoraireMin',
	'tauxHoraireMax',
	'description',
	'departement',
	'ville',
	'rating',
	'disponible7J'
] as const;

const USER_FIELDS = ['firstName', 'lastName', 'email'] as const;

export const load = (async ({ params }) => {
	const formateur = await db.query.formateurs.findFirst({
		where: eq(formateurs.id, params.id),
		with: {
			user: true,
			formateursThematiques: {
				with: { thematique: { columns: { name: true, id: true } } }
			}
		}
	});

	if (!formateur) throw error(404, 'Formateur non trouvé');

	const name =
		[formateur.user?.firstName, formateur.user?.lastName].filter(Boolean).join(' ') ||
		'Formateur';

	return {
		formateur,
		header: {
			pageName: name,
			backButton: true,
			backButtonLabel: 'Formateurs',
			backButtonHref: '/contacts/formateurs',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteFormateur: async ({ params, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		await db.delete(formateurs).where(eq(formateurs.id, params.id));
		throw redirect(303, '/contacts/formateurs');
	},

	updateFormateurField: async ({ params, request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const field = (fd.get('field') as string)?.trim();
		const value = (fd.get('value') as string)?.trim() ?? '';

		if (!FORMATEUR_FIELDS.includes(field as (typeof FORMATEUR_FIELDS)[number])) {
			return fail(400, { message: 'Champ invalide' });
		}

		// Coerce typed fields
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let dbValue: any = value || null;

		if (field === 'tauxHoraireMin' || field === 'tauxHoraireMax' || field === 'rating') {
			if (value === '') {
				dbValue = null;
			} else {
				const n = Number(value);
				if (isNaN(n) || n < 0) return fail(400, { message: 'Valeur numérique invalide' });
				if (field === 'rating' && n > 5)
					return fail(400, { message: 'La note doit être comprise entre 0 et 5' });
				dbValue = String(n);
			}
		} else if (field === 'disponible7J') {
			dbValue = value === 'true';
		}

		await db
			.update(formateurs)
			.set({ [field]: dbValue })
			.where(eq(formateurs.id, params.id));

		return { success: true };
	},

	updateCityDepartement: async ({ params, request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const ville = (fd.get('ville') as string)?.trim() || null;
		const departement = (fd.get('departement') as string)?.trim() || null;

		await db
			.update(formateurs)
			.set({ ville, departement })
			.where(eq(formateurs.id, params.id));

		return { success: true };
	},

	updateUserField: async ({ params, request, locals }) => {
		const { user } = await locals.safeGetSession();
		if (!user) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const field = (fd.get('field') as string)?.trim();
		const value = (fd.get('value') as string)?.trim() ?? '';

		if (!USER_FIELDS.includes(field as (typeof USER_FIELDS)[number])) {
			return fail(400, { message: 'Champ invalide' });
		}

		const formateur = await db.query.formateurs.findFirst({
			where: eq(formateurs.id, params.id),
			columns: { userId: true }
		});
		if (!formateur) return fail(404, { message: 'Formateur non trouvé' });

		if (field === 'email' && !value) {
			return fail(400, { message: "L'email est requis" });
		}

		try {
			await db
				.update(users)
				.set({ [field]: value || null })
				.where(eq(users.id, formateur.userId));
		} catch (e) {
			const msg = e instanceof Error ? e.message : String(e);
			if (msg.includes('unique') || msg.includes('duplicate')) {
				return fail(409, { message: 'Cet email est déjà utilisé' });
			}
			throw e;
		}

		return { success: true };
	}
};
