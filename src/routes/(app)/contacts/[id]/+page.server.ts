import { db } from '$lib/db';
import { contacts, companies, contactCompanies } from '$lib/db/schema';
import { getUserWorkspace } from '$lib/auth';
import { and, eq, desc } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { posteOptions, validateContactName } from '$lib/crm/contact-schema';

const ALLOWED_FIELDS = [
	'firstName',
	'lastName',
	'email',
	'phone',
	'poste',
	'linkedinUrl',
	'internalNotes'
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

export const load = (async ({ params, locals }) => {
	const workspaceId = await getUserWorkspace(locals);
	if (!workspaceId) throw error(401, 'Espace non trouvé');

	const contact = await db.query.contacts.findFirst({
		where: and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)),
		with: {
			contactCompanies: { with: { company: true } },
			owner: { columns: { id: true, firstName: true, lastName: true, email: true } },
			deals: {
				with: {
					formation: {
						columns: { id: true, name: true, statut: true, createdAt: true }
					}
				}
			}
		}
	});

	if (!contact) throw error(404, 'Contact non trouvé');

	// All workspace companies for the link combobox
	const allCompanies = await db
		.select({ id: companies.id, name: companies.name })
		.from(companies)
		.where(eq(companies.workspaceId, workspaceId))
		.orderBy(desc(companies.updatedAt));

	const pageName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Contact';

	return {
		contact,
		allCompanies,
		header: {
			pageName,
			backButton: true,
			backButtonLabel: 'CRM',
			backButtonHref: '/contacts',
			actions: []
		}
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	deleteContact: async ({ params, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Espace non trouvé' });
		const [contact] = await db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)))
			.limit(1);
		if (!contact) throw error(404, 'Contact non trouvé');
		await db.delete(contacts).where(eq(contacts.id, contact.id));
		throw redirect(303, '/contacts');
	},

	updateField: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const field = (fd.get('field') as string)?.trim() as AllowedField;
		const value = (fd.get('value') as string)?.trim() ?? '';

		if (!ALLOWED_FIELDS.includes(field)) {
			return fail(400, { message: 'Champ invalide' });
		}

		// Validate enum for poste
		if (field === 'poste' && value && !posteOptions.includes(value as (typeof posteOptions)[number])) {
			return fail(400, { message: 'Poste invalide' });
		}

		// Validate name fields (same rules as contact form)
		if (field === 'firstName') {
			const err = validateContactName(value, { requiredMessage: 'Le prénom est requis' });
			if (err) return fail(400, { message: err });
		}
		if (field === 'lastName') {
			const err = validateContactName(value, { requiredMessage: 'Le nom est requis' });
			if (err) return fail(400, { message: err });
		}

		const updated = await db
			.update(contacts)
			.set({ [field]: value || null, updatedAt: new Date().toISOString() })
			.where(and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)))
			.returning({ id: contacts.id });

		if (updated.length === 0) return fail(404, { message: 'Contact non trouvé' });

		return { success: true };
	},

	linkCompany: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const companyId = (fd.get('companyId') as string)?.trim();
		if (!companyId) return fail(400, { message: 'Entreprise manquante' });

		// Verify contact belongs to same workspace (prevent IDOR)
		const [contact] = await db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)))
			.limit(1);
		if (!contact) return fail(404, { message: 'Contact non trouvé' });

		// Verify company belongs to same workspace
		const [company] = await db
			.select({ id: companies.id })
			.from(companies)
			.where(and(eq(companies.id, companyId), eq(companies.workspaceId, workspaceId)))
			.limit(1);
		if (!company) return fail(404, { message: 'Entreprise non trouvée' });

		// Insert, ignore if already linked (conflict on primary key)
		await db
			.insert(contactCompanies)
			.values({ contactId: contact.id, companyId })
			.onConflictDoNothing();

		return { success: true };
	},

	unlinkCompany: async ({ params, request, locals }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });

		const fd = await request.formData();
		const companyId = (fd.get('companyId') as string)?.trim();
		if (!companyId) return fail(400, { message: 'Entreprise manquante' });

		const [contact] = await db
			.select({ id: contacts.id })
			.from(contacts)
			.where(and(eq(contacts.id, params.id), eq(contacts.workspaceId, workspaceId)))
			.limit(1);
		if (!contact) return fail(404, { message: 'Contact non trouvé' });

		const [company] = await db
			.select({ id: companies.id })
			.from(companies)
			.where(and(eq(companies.id, companyId), eq(companies.workspaceId, workspaceId)))
			.limit(1);
		if (!company) return fail(404, { message: 'Entreprise non trouvée' });

		await db
			.delete(contactCompanies)
			.where(
				and(
					eq(contactCompanies.contactId, params.id),
					eq(contactCompanies.companyId, companyId)
				)
			);

		return { success: true };
	}
};
