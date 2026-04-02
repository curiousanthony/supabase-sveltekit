import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { emargements } from '$lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { uploadSignatureImage } from '$lib/services/document-service';

export const load = (async ({ params }) => {
	const token = params.token;

	const emargement = await db.query.emargements.findFirst({
		where: eq(emargements.signatureToken, token),
		with: {
			seance: {
				columns: { id: true, startAt: true, endAt: true, location: true },
				with: {
					formation: { columns: { id: true, name: true } }
				}
			},
		contact: { columns: { id: true, firstName: true, lastName: true } },
		formateur: {
			columns: { id: true },
			with: {
				user: { columns: { id: true, firstName: true, lastName: true } }
			}
		}
		}
	});

	if (!emargement) throw error(404, "Lien d'émargement invalide");

	const signerName = emargement.signerType === 'formateur'
		? [emargement.formateur?.user?.firstName, emargement.formateur?.user?.lastName]
				.filter(Boolean).join(' ') || 'Formateur'
		: [emargement.contact?.firstName, emargement.contact?.lastName]
				.filter(Boolean).join(' ') || 'Participant';

	const seanceId = emargement.seanceId;
	const contactId = emargement.contactId;
	const formateurId = emargement.formateurId;

	let siblingSlots: Array<{
		id: string;
		period: string;
		signedAt: string | null;
		signatureImageUrl: string | null;
	}> = [];

	if (contactId) {
		siblingSlots = await db
			.select({
				id: emargements.id,
				period: emargements.period,
				signedAt: emargements.signedAt,
				signatureImageUrl: emargements.signatureImageUrl
			})
			.from(emargements)
			.where(
				and(
					eq(emargements.seanceId, seanceId),
					eq(emargements.contactId, contactId),
					eq(emargements.signerType, 'apprenant')
				)
			);
	} else if (formateurId) {
		siblingSlots = await db
			.select({
				id: emargements.id,
				period: emargements.period,
				signedAt: emargements.signedAt,
				signatureImageUrl: emargements.signatureImageUrl
			})
			.from(emargements)
			.where(
				and(
					eq(emargements.seanceId, seanceId),
					eq(emargements.formateurId, formateurId),
					eq(emargements.signerType, 'formateur')
				)
			);
	} else {
		siblingSlots = [{
			id: emargement.id,
			period: emargement.period,
			signedAt: emargement.signedAt,
			signatureImageUrl: emargement.signatureImageUrl
		}];
	}

	const sortOrder = { morning: 0, afternoon: 1 };
	siblingSlots.sort((a, b) => (sortOrder[a.period as keyof typeof sortOrder] ?? 0) - (sortOrder[b.period as keyof typeof sortOrder] ?? 0));

	return {
		signerName,
		signerType: emargement.signerType,
		formationName: emargement.seance?.formation?.name ?? 'Formation',
		sessionDate: emargement.seance?.startAt ?? '',
		sessionEndAt: emargement.seance?.endAt ?? '',
		sessionLocation: emargement.seance?.location ?? null,
		slots: siblingSlots,
		allSigned: siblingSlots.every((s) => s.signedAt !== null)
	};
}) satisfies PageServerLoad;

export const actions = {
	sign: async ({ request, getClientAddress }) => {
		const formData = await request.formData();
		const emargementId = formData.get('emargementId') as string;
		const signatureDataUrl = formData.get('signature') as string;

		if (!emargementId) return fail(400, { message: 'ID émargement requis' });
		if (!signatureDataUrl) return fail(400, { message: 'Signature requise' });

		const emargement = await db.query.emargements.findFirst({
			where: eq(emargements.id, emargementId),
			columns: { id: true, signedAt: true }
		});

		if (!emargement) return fail(404, { message: 'Émargement introuvable' });
		if (emargement.signedAt) return fail(400, { message: 'Déjà signé' });

		const { publicUrl } = await uploadSignatureImage(signatureDataUrl, emargement.id);

		const ip = getClientAddress();
		const userAgent = request.headers.get('user-agent') ?? '';

		await db
			.update(emargements)
			.set({
				signedAt: new Date().toISOString(),
				signatureImageUrl: publicUrl ?? null,
				signerIp: ip,
				signerUserAgent: userAgent
			})
			.where(eq(emargements.id, emargement.id));

		return { success: true, signedId: emargementId };
	}
} satisfies Actions;
