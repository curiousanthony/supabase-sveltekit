import type { PageServerLoad, Actions } from './$types';
import { error, fail } from '@sveltejs/kit';
import { db } from '$lib/db';
import { emargements } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
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
			contact: { columns: { id: true, firstName: true, lastName: true } }
		}
	});

	if (!emargement) throw error(404, "Lien d'émargement invalide");

	return {
		emargement: {
			id: emargement.id,
			signedAt: emargement.signedAt,
			signatureImageUrl: emargement.signatureImageUrl,
			learnerName:
				[emargement.contact?.firstName, emargement.contact?.lastName]
					.filter(Boolean)
					.join(' ') || 'Participant',
			formationName: emargement.seance?.formation?.name ?? 'Formation',
			sessionDate: emargement.seance?.startAt ?? '',
			sessionEndAt: emargement.seance?.endAt ?? '',
			sessionLocation: emargement.seance?.location ?? null
		}
	};
}) satisfies PageServerLoad;

export const actions = {
	sign: async ({ request, params, getClientAddress }) => {
		const token = params.token;
		const formData = await request.formData();
		const signatureDataUrl = formData.get('signature') as string;

		if (!signatureDataUrl) return fail(400, { message: 'Signature requise' });

		const emargement = await db.query.emargements.findFirst({
			where: eq(emargements.signatureToken, token)
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

		return { success: true };
	}
} satisfies Actions;
