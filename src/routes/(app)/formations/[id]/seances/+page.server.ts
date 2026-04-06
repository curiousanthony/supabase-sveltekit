import { fail } from '@sveltejs/kit';
import { fromDate } from '@internationalized/date';
import { db } from '$lib/db';
import { formations, modules, seances, emargements, contacts, formateurs } from '$lib/db/schema';
import { eq, and, inArray, isNull } from 'drizzle-orm';
import { getUserWorkspace } from '$lib/auth';
import {
	FORMATION_SCHEDULE_TIMEZONE,
	seanceFormInputToUtcIso
} from '$lib/datetime/seance-schedule';
import { logAuditEvent } from '$lib/services/audit-log';
import { sendFormationTemplateEmail } from '$lib/services/email-service';
import { workspaces } from '$lib/db/schema';
import { env } from '$env/dynamic/private';
import type { Actions } from './$types';

type EmargementPeriod = 'morning' | 'afternoon';

function getPeriodsForSession(startAt: string, endAt: string): EmargementPeriod[] {
	const start = new Date(startAt);
	const end = new Date(endAt);
	const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);

	if (durationHours > 4) {
		return ['morning', 'afternoon'];
	}
	const zoned = fromDate(start, FORMATION_SCHEDULE_TIMEZONE);
	return [zoned.hour < 13 ? 'morning' : 'afternoon'];
}

function buildEmargementRows(
	seanceId: string,
	contactIds: string[],
	periods: EmargementPeriod[],
	formateurId: string | null
) {
	const rows: Array<{
		seanceId: string;
		contactId?: string;
		formateurId?: string;
		signerType: 'apprenant' | 'formateur';
		period: EmargementPeriod;
	}> = [];

	for (const contactId of contactIds) {
		for (const period of periods) {
			rows.push({ seanceId, contactId, signerType: 'apprenant', period });
		}
	}

	if (formateurId) {
		for (const period of periods) {
			rows.push({ seanceId, formateurId, signerType: 'formateur', period });
		}
	}

	return rows;
}

async function verifyFormationOwnership(params: { id: string }, workspaceId: string) {
	const formation = await db.query.formations.findFirst({
		where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
		columns: { id: true }
	});
	return !!formation;
}

/** Lieu/salle only for Présentiel / Hybride; effective modality = override ?? formation (same as UI). */
function normalizeVenueForModality(
	modalityOverride: string | null,
	formationModalite: string | null,
	location: string | null,
	room: string | null
): { location: string | null; room: string | null } {
	const effective = modalityOverride || formationModalite;
	if (effective === 'Présentiel' || effective === 'Hybride') {
		return { location, room };
	}
	return { location: null, room: null };
}

export const actions: Actions = {
	createSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const moduleId = formData.get('moduleId') as string | null;
		const startAt = formData.get('startAt') as string | null;
		const endAt = formData.get('endAt') as string | null;
		const location = (formData.get('location') as string | null) || null;
		const room = (formData.get('room') as string | null) || null;
		const modalityOverride =
			(formData.get('modalityOverride') as string | null) || null;
		const contactIds = formData.getAll('contactIds') as string[];

		if (!moduleId) return fail(400, { message: 'Module requis' });
		if (!startAt || !endAt) return fail(400, { message: 'Dates requises' });

		let startUtc: string;
		let endUtc: string;
		try {
			startUtc = seanceFormInputToUtcIso(startAt);
			endUtc = seanceFormInputToUtcIso(endAt);
		} catch {
			return fail(400, { message: 'Dates invalides' });
		}

		if (new Date(endUtc) <= new Date(startUtc)) {
			return fail(400, { message: 'La fin doit être après le début' });
		}

		try {
			const formationRow = await db.query.formations.findFirst({
				where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
				columns: { modalite: true }
			});
			const { location: venueLocation, room: venueRoom } = normalizeVenueForModality(
				modalityOverride,
				formationRow?.modalite ?? null,
				location,
				room
			);

			let formateurId: string | null = null;
			const mod = await db.query.modules.findFirst({
				where: eq(modules.id, moduleId),
				columns: { formateurId: true }
			});
			if (mod?.formateurId) {
				formateurId = mod.formateurId;
			}

			const [created] = await db
				.insert(seances)
				.values({
					formationId: params.id,
					createdBy: user.id,
					moduleId,
					startAt: startUtc,
					endAt: endUtc,
					location: venueLocation,
					room: venueRoom,
					formateurId,
					modalityOverride: modalityOverride as typeof seances.$inferInsert.modalityOverride
				})
				.returning({ id: seances.id });

			const periods = getPeriodsForSession(startUtc, endUtc);
			const emargementRows = buildEmargementRows(created.id, contactIds, periods, formateurId);

			if (emargementRows.length > 0) {
				await db.insert(emargements).values(emargementRows);
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_created',
				entityType: 'seance',
				entityId: created.id
			});

			return { success: true, seanceId: created.id };
		} catch (e: unknown) {
			console.error('[createSession]', e);
			return fail(500, { message: 'Erreur lors de la création' });
		}
	},

	batchCreateSessions: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const rawSessions = formData.get('sessions') as string | null;
		const rawContactIds = formData.getAll('contactIds') as string[];

		if (!rawSessions) return fail(400, { message: 'Sessions requises' });

		let sessionEntries: Array<{
			date: string;
			startTime: string;
			endTime: string;
			moduleId: string;
			location?: string;
			room?: string;
			modalityOverride?: string;
		}>;

		try {
			sessionEntries = JSON.parse(rawSessions);
		} catch {
			return fail(400, { message: 'Format de sessions invalide' });
		}

		if (sessionEntries.length === 0) return fail(400, { message: 'Au moins une séance requise' });

		try {
			const formationRow = await db.query.formations.findFirst({
				where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
				columns: { modalite: true }
			});
			const formationModalite = formationRow?.modalite ?? null;

			const createdIds: string[] = [];

			for (const entry of sessionEntries) {
				const naiveStart = `${entry.date}T${entry.startTime}:00`;
				const naiveEnd = `${entry.date}T${entry.endTime}:00`;
				let startUtc: string;
				let endUtc: string;
				try {
					startUtc = seanceFormInputToUtcIso(naiveStart);
					endUtc = seanceFormInputToUtcIso(naiveEnd);
				} catch {
					continue;
				}

				if (new Date(endUtc) <= new Date(startUtc)) continue;

				let formateurId: string | null = null;
				if (entry.moduleId) {
					const mod = await db.query.modules.findFirst({
						where: eq(modules.id, entry.moduleId),
						columns: { formateurId: true }
					});
					if (mod?.formateurId) formateurId = mod.formateurId;
				}

				const entryModalityOverride = (entry.modalityOverride || null) as typeof seances.$inferInsert.modalityOverride;
				const { location: venueLocation, room: venueRoom } = normalizeVenueForModality(
					entryModalityOverride,
					formationModalite,
					entry.location || null,
					entry.room || null
				);

				const [created] = await db
					.insert(seances)
					.values({
						formationId: params.id,
						createdBy: user.id,
						moduleId: entry.moduleId,
						startAt: startUtc,
						endAt: endUtc,
						location: venueLocation,
						room: venueRoom,
						formateurId,
						modalityOverride: entryModalityOverride
					})
					.returning({ id: seances.id });

				const periods = getPeriodsForSession(startUtc, endUtc);
				const emargementRows = buildEmargementRows(created.id, rawContactIds, periods, formateurId);

				if (emargementRows.length > 0) {
					await db.insert(emargements).values(emargementRows);
				}

				createdIds.push(created.id);
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'sessions_batch_created',
				entityType: 'seance',
				newValue: { count: createdIds.length }
			});

			return { success: true, createdCount: createdIds.length };
		} catch (e: unknown) {
			console.error('[batchCreateSessions]', e);
			return fail(500, { message: 'Erreur lors de la création par lot' });
		}
	},

	updateSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		const moduleId = formData.get('moduleId') as string | null;
		const startAt = formData.get('startAt') as string | null;
		const endAt = formData.get('endAt') as string | null;
		const location = (formData.get('location') as string | null) || null;
		const room = (formData.get('room') as string | null) || null;
		const modalityOverride =
			(formData.get('modalityOverride') as string | null) || null;

		if (!moduleId) return fail(400, { message: 'Module requis' });
		if (!startAt || !endAt) return fail(400, { message: 'Dates requises' });

		let startUtc: string;
		let endUtc: string;
		try {
			startUtc = seanceFormInputToUtcIso(startAt);
			endUtc = seanceFormInputToUtcIso(endAt);
		} catch {
			return fail(400, { message: 'Dates invalides' });
		}

		if (new Date(endUtc) <= new Date(startUtc)) {
			return fail(400, { message: 'La fin doit être après le début' });
		}

		try {
			const formationRow = await db.query.formations.findFirst({
				where: and(eq(formations.id, params.id), eq(formations.workspaceId, workspaceId)),
				columns: { modalite: true }
			});
			const { location: venueLocation, room: venueRoom } = normalizeVenueForModality(
				modalityOverride,
				formationRow?.modalite ?? null,
				location,
				room
			);

			let formateurId: string | null = null;
			const mod = await db.query.modules.findFirst({
				where: eq(modules.id, moduleId),
				columns: { formateurId: true }
			});
			if (mod?.formateurId) {
				formateurId = mod.formateurId;
			}

			const result = await db
				.update(seances)
				.set({
					moduleId,
					startAt: startUtc,
					endAt: endUtc,
					location: venueLocation,
					room: venueRoom,
					formateurId,
					modalityOverride: modalityOverride as typeof seances.$inferInsert.modalityOverride
				})
				.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)))
				.returning({ id: seances.id });

			if (result.length === 0) {
				return fail(404, { message: 'Séance introuvable' });
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_updated',
				entityType: 'seance',
				entityId: seanceId
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[updateSession]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour' });
		}
	},

	deleteSession: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		try {
			const result = await db
				.delete(seances)
				.where(and(eq(seances.id, seanceId), eq(seances.formationId, params.id)))
				.returning({ id: seances.id });

			if (result.length === 0) {
				return fail(404, { message: 'Séance introuvable' });
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'session_deleted',
				entityType: 'seance',
				entityId: seanceId
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[deleteSession]', e);
			return fail(500, { message: 'Erreur lors de la suppression' });
		}
	},

	updateEmargementParticipants: async ({ request, locals, params }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		const selectedContactIds = formData.getAll('contactIds') as string[];

		try {
			const seanceRow = await db.query.seances.findFirst({
				where: eq(seances.id, seanceId),
				columns: { startAt: true, endAt: true }
			});
			if (!seanceRow) return fail(404, { message: 'Séance introuvable' });

			const periods = getPeriodsForSession(seanceRow.startAt, seanceRow.endAt);

			const existing = await db
				.select({
					id: emargements.id,
					contactId: emargements.contactId,
					period: emargements.period,
					signedAt: emargements.signedAt
				})
				.from(emargements)
				.where(
					and(
						eq(emargements.seanceId, seanceId),
						eq(emargements.signerType, 'apprenant')
					)
				);

			const existingContactIds = [...new Set(
				existing
					.map((e) => e.contactId)
					.filter((contactId): contactId is string => contactId !== null)
			)];

			const toAdd = selectedContactIds.filter((id) => !existingContactIds.includes(id));
			const toRemove = existing.filter(
				(e) => e.contactId !== null && !selectedContactIds.includes(e.contactId) && e.signedAt === null
			);

			if (toAdd.length > 0) {
				const newRows: Array<{
					seanceId: string;
					contactId: string;
					signerType: 'apprenant';
					period: EmargementPeriod;
				}> = [];
				for (const contactId of toAdd) {
					for (const period of periods) {
						newRows.push({ seanceId, contactId, signerType: 'apprenant', period });
					}
				}
				await db.insert(emargements).values(newRows);
			}

			if (toRemove.length > 0) {
				const removableIds = toRemove.map((e) => e.id);
				await db.delete(emargements).where(
					and(
						inArray(emargements.id, removableIds),
						isNull(emargements.signedAt)
					)
				);
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'emargement_participants_updated',
				entityType: 'seance',
				entityId: seanceId,
				newValue: { added: toAdd.length, removed: toRemove.length }
			});

			return { success: true };
		} catch (e: unknown) {
			console.error('[updateEmargementParticipants]', e);
			return fail(500, { message: 'Erreur lors de la mise à jour des participants' });
		}
	},

	sendEmargementLinks: async ({ request, locals, params, url }) => {
		const workspaceId = await getUserWorkspace(locals);
		if (!workspaceId) return fail(401, { message: 'Non autorisé' });
		const { session, user } = await locals.safeGetSession();
		if (!session || !user) return fail(401, { message: 'Non autorisé' });

		if (!(await verifyFormationOwnership(params, workspaceId))) {
			return fail(403, { message: 'Accès refusé' });
		}

		const formData = await request.formData();
		const seanceId = formData.get('seanceId') as string | null;
		if (!seanceId) return fail(400, { message: 'ID séance requis' });

		try {
			const seanceRow = await db.query.seances.findFirst({
				where: and(eq(seances.id, seanceId), eq(seances.formationId, params.id)),
				columns: { id: true, startAt: true, endAt: true, location: true },
				with: {
					formation: { columns: { id: true, name: true } },
					emargements: {
						columns: { id: true, contactId: true, formateurId: true, signatureToken: true, signedAt: true, signerType: true },
						where: isNull(emargements.signedAt)
					}
				}
			});

			if (!seanceRow) return fail(404, { message: 'Séance introuvable' });

			const unsignedEmargements = seanceRow.emargements;
			if (unsignedEmargements.length === 0) {
				return fail(400, { message: 'Tous les émargements sont déjà signés' });
			}

			const contactIds = [...new Set(unsignedEmargements
				.filter((e) => e.contactId)
				.map((e) => e.contactId!))];
			const formateurIds = [...new Set(unsignedEmargements
				.filter((e) => e.formateurId)
				.map((e) => e.formateurId!))];

			const contactList = contactIds.length > 0
				? await db.query.contacts.findMany({
						where: inArray(contacts.id, contactIds),
						columns: { id: true, firstName: true, lastName: true, email: true }
					})
				: [];

			const formateurList = formateurIds.length > 0
				? await db.query.formateurs.findMany({
						where: inArray(formateurs.id, formateurIds),
						columns: { id: true },
						with: { user: { columns: { id: true, firstName: true, lastName: true, email: true } } }
					})
				: [];

			const origin = url.origin || env.PUBLIC_SITE_URL || 'https://app.mentoremanager.fr';
			const formationName = seanceRow.formation?.name ?? 'Formation';
			const sessionDate = new Date(seanceRow.startAt).toLocaleDateString('fr-FR', {
				weekday: 'long',
				day: 'numeric',
				month: 'long',
				year: 'numeric',
				timeZone: FORMATION_SCHEDULE_TIMEZONE
			});

			const ws = await db.query.workspaces.findFirst({
				where: eq(workspaces.id, workspaceId),
				columns: { name: true, logoUrl: true, address: true, city: true, postalCode: true }
			});
			const workspaceName = ws?.name ?? '';
			const workspaceLogoUrl = ws?.logoUrl ?? '';
			const workspaceAddress = [ws?.address, ws?.postalCode, ws?.city].filter(Boolean).join(', ');

			let sentCount = 0;
			let failedCount = 0;
			let sendAttempts = 0;
			let firstError: string | undefined;

			for (const contact of contactList) {
				if (!contact.email) continue;
				const firstToken = unsignedEmargements.find((e) => e.contactId === contact.id)?.signatureToken;
				if (!firstToken) continue;

				const signingUrl = `${origin}/emargement/${firstToken}`;
				const learnerName = [contact.firstName, contact.lastName].filter(Boolean).join(' ') || 'Participant';

				sendAttempts++;
				const sendResult = await sendFormationTemplateEmail(
					{
						to: contact.email,
						toName: learnerName,
						templateAlias: 'emargement-apprenant',
						templateModel: {
							recipientName: learnerName,
							formationName,
							sessionDate,
							ctaUrl: signingUrl,
							workspaceName,
							workspaceLogoUrl,
							workspaceAddress
						},
						tag: 'emargement_link'
					},
					params.id,
					{ type: 'emargement_link', recipientType: 'apprenant', createdBy: user.id }
				);
				if (sendResult.sendStatus === 'sent') {
					sentCount++;
				} else {
					failedCount++;
					firstError ??=
						sendResult.providerError ??
						(sendResult.sendStatus === 'logged'
							? 'Envoi e-mail non configuré (jeton Postmark manquant).'
							: "L'envoi a échoué.");
				}
			}

			for (const f of formateurList) {
				if (!f.user?.email) continue;
				const firstToken = unsignedEmargements.find((e) => e.formateurId === f.id)?.signatureToken;
				if (!firstToken) continue;

				const signingUrl = `${origin}/emargement/${firstToken}`;
				const fName = [f.user.firstName, f.user.lastName].filter(Boolean).join(' ') || 'Formateur';

				sendAttempts++;
				const sendResult = await sendFormationTemplateEmail(
					{
						to: f.user.email,
						toName: fName,
						templateAlias: 'emargement-formateur',
						templateModel: {
							recipientName: fName,
							formationName,
							sessionDate,
							ctaUrl: signingUrl,
							workspaceName,
							workspaceLogoUrl,
							workspaceAddress
						},
						tag: 'emargement_link_formateur'
					},
					params.id,
					{ type: 'emargement_link', recipientType: 'formateur', createdBy: user.id }
				);
				if (sendResult.sendStatus === 'sent') {
					sentCount++;
				} else {
					failedCount++;
					firstError ??=
						sendResult.providerError ??
						(sendResult.sendStatus === 'logged'
							? 'Envoi e-mail non configuré (jeton Postmark manquant).'
							: "L'envoi a échoué.");
				}
			}

			if (sendAttempts > 0 && sentCount === 0) {
				return fail(502, {
					message:
						firstError?.slice(0, 280) ??
						"Aucun e-mail n'a pu être envoyé. Vérifiez l'expéditeur Postmark, les signatures d'envoi et les modèles."
				});
			}

			if (sendAttempts === 0) {
				return fail(400, {
					message:
						'Aucun destinataire pour ces liens. Vérifiez les e-mails des apprenants et du formateur.'
				});
			}

			await logAuditEvent({
				formationId: params.id,
				userId: user.id,
				actionType: 'emargement_links_sent',
				entityType: 'seance',
				entityId: seanceId,
				newValue: { sentCount, failedCount, sendAttempts }
			});

			return { success: true, sentCount, failedCount };
		} catch (e: unknown) {
			console.error('[sendEmargementLinks]', e);
			return fail(500, { message: "Erreur lors de l'envoi des liens" });
		}
	}
};
