import { error, fail } from '@sveltejs/kit';
import type { Session } from '@supabase/supabase-js';
import { db } from '$lib/db';
import { emargements } from '$lib/db/schema';
import { uploadSignatureImage } from '$lib/services/document-service';
import { getSupabaseAdmin } from '$lib/server/supabase-admin';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load = (async ({ params }) => {
	const record = await db.query.emargements.findFirst({
		where: eq(emargements.signatureToken, params.token),
		with: {
			seance: {
				columns: { startAt: true, endAt: true },
				with: {
					formation: { columns: { name: true } }
				}
			},
			contact: {
				columns: { firstName: true, lastName: true }
			}
		}
	});

	if (!record) {
		throw error(404, 'Émargement introuvable');
	}

	const learnerName =
		[record.contact?.firstName, record.contact?.lastName].filter(Boolean).join(' ') || 'Participant';

	const startAt = record.seance?.startAt ?? '';
	const endAt = record.seance?.endAt ?? '';

	return {
		/** Satisfies `App.PageData` for this public route (no server session). */
		session: null as Session | null,
		formationName: record.seance?.formation?.name ?? 'Formation',
		sessionDate: startAt,
		sessionStartTime: startAt,
		sessionEndTime: endAt,
		learnerName,
		alreadySigned: !!record.signedAt,
		signatureImageUrl: record.signatureImageUrl ?? null,
		token: params.token
	};
}) satisfies PageServerLoad;

export const actions: Actions = {
	default: async ({ request, params }) => {
		const formData = await request.formData();
		const signatureData = formData.get('signatureData');
		if (typeof signatureData !== 'string' || !signatureData.startsWith('data:image/')) {
			return fail(400, { message: 'Signature invalide' });
		}

		const record = await db.query.emargements.findFirst({
			where: eq(emargements.signatureToken, params.token),
			columns: { id: true, signedAt: true }
		});
		if (!record) return fail(404, { message: 'Émargement introuvable' });
		if (record.signedAt) return fail(400, { message: 'Déjà signé' });

		const signerIp =
			request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
			request.headers.get('x-real-ip') ??
			'unknown';
		const signerUserAgent = request.headers.get('user-agent') ?? 'unknown';

		const admin = getSupabaseAdmin();
		let signatureImageUrl: string;

		if (admin) {
			try {
				const { publicUrl } = await uploadSignatureImage(admin, signatureData, record.id);
				if (!publicUrl) {
					return fail(500, { message: "Impossible d'enregistrer la signature" });
				}
				signatureImageUrl = publicUrl;
			} catch (e) {
				console.error('[emargement] signature upload failed:', e);
				return fail(500, { message: "Impossible d'enregistrer la signature" });
			}
		} else {
			console.warn('[emargement] SUPABASE_SERVICE_ROLE_KEY missing; storing data URL in DB (dev only)');
			signatureImageUrl = signatureData;
		}

		await db
			.update(emargements)
			.set({
				signedAt: new Date().toISOString(),
				signatureImageUrl,
				signerIp,
				signerUserAgent
			})
			.where(eq(emargements.signatureToken, params.token));

		return { success: true };
	}
};
