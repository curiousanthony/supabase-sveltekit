import { db } from '$lib/db';
import { formationEmails } from '$lib/db/schema';
import { env } from '$env/dynamic/private';

const DEFAULT_POSTMARK_FETCH_TIMEOUT_MS = 30_000;

/** Shown when Postmark accepts the API call but the server is Sandbox (no real inbox delivery). */
export const POSTMARK_SANDBOX_PROVIDER_HINT =
	'Serveur Postmark « bac à sable » : l’API accepte l’envoi mais aucun message n’est livré dans une vraie boîte mail. Utilisez un serveur de transaction « Live » et son jeton API.';

let postmarkDeliveryTypePromise: Promise<'Live' | 'Sandbox' | null> | null = null;

/** Clears cached GET /server result (Vitest only). */
export function resetPostmarkServerMetadataCacheForTests(): void {
	postmarkDeliveryTypePromise = null;
}

/**
 * Resolves whether the configured server token points to a Live or Sandbox Postmark server.
 * Cached for the lifetime of the process. Optional env `POSTMARK_SERVER_DELIVERY_TYPE` forces the value (tests).
 */
async function getPostmarkServerDeliveryType(): Promise<'Live' | 'Sandbox' | null> {
	const override = env.POSTMARK_SERVER_DELIVERY_TYPE;
	if (override === 'Live' || override === 'Sandbox') {
		return override;
	}

	const token = env.POSTMARK_SERVER_TOKEN;
	if (!token) return null;

	if (!postmarkDeliveryTypePromise) {
		postmarkDeliveryTypePromise = (async () => {
			try {
				const timeoutMs = Math.min(getPostmarkFetchTimeoutMs(), 10_000);
				const controller = new AbortController();
				const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
				let response: Response;
				try {
					response = await fetch('https://api.postmarkapp.com/server', {
						method: 'GET',
						headers: {
							Accept: 'application/json',
							'X-Postmark-Server-Token': token
						},
						signal: controller.signal
					});
				} finally {
					clearTimeout(timeoutId);
				}
				if (!response.ok) return null;
				const j = (await response.json()) as { DeliveryType?: string };
				if (j.DeliveryType === 'Sandbox') return 'Sandbox';
				if (j.DeliveryType === 'Live') return 'Live';
				return null;
			} catch (e) {
				console.warn('[postmark] Impossible de lire DeliveryType du serveur :', e);
				return null;
			}
		})();
	}
	return postmarkDeliveryTypePromise;
}

function getPostmarkFetchTimeoutMs(): number {
	const raw = env.POSTMARK_FETCH_TIMEOUT_MS;
	const parsed = raw != null && raw !== '' ? Number.parseInt(raw, 10) : NaN;
	return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_POSTMARK_FETCH_TIMEOUT_MS;
}

function isAbortError(err: unknown): boolean {
	if (err instanceof DOMException && err.name === 'AbortError') return true;
	if (err instanceof Error && err.name === 'AbortError') return true;
	return false;
}

export interface TemplateEmailPayload {
	to: string;
	toName?: string;
	templateAlias: string;
	templateModel: Record<string, unknown>;
	attachments?: { filename: string; content: Buffer; contentType: string }[];
	tag?: string;
}

export type EmailSendStatus = 'sent' | 'failed' | 'logged' | 'sandbox';

export interface SendEmailResult {
	emailId: string;
	postmarkMessageId?: string;
	/**
	 * `sent` = Live server accepted and message will be delivered.
	 * `sandbox` = Postmark API accepted but server is Sandbox (no real inbox delivery).
	 * `failed` / `logged` = rejected or not sent via API.
	 */
	sendStatus: EmailSendStatus;
	/** Postmark error or sandbox hint when sendStatus is `failed` or `sandbox`. */
	providerError?: string;
}

export const EMAIL_TYPE_TO_TEMPLATE: Record<string, string> = {
	analyse_besoins: 'analyse-besoins',
	analyse_besoins_resultats: 'analyse-besoins-resultats',
	devis_envoi: 'devis-envoi',
	devis_relance: 'devis-relance',
	convention_envoi: 'convention-envoi',
	convention_relance: 'convention-relance',
	convocation: 'convocation',
	reglement_interieur: 'reglement-interieur',
	test_positionnement: 'test-positionnement',
	ordre_mission_envoi: 'ordre-mission-envoi',
	ordre_mission_relance: 'ordre-mission-relance',
	relance_documents_formateur: 'relance-documents-formateur',
	emargement_link: 'emargement-apprenant',
	emargement_link_formateur: 'emargement-formateur',
	rappel_emargement: 'rappel-emargement',
	notification_absence: 'notification-absence',
	satisfaction_chaud: 'satisfaction-chaud',
	satisfaction_chaud_client: 'satisfaction-chaud-client',
	certificat_realisation: 'certificat-realisation',
	attestation_fin_formation: 'attestation-fin-formation',
	facture_envoi: 'facture-envoi',
	satisfaction_froid: 'satisfaction-froid',
	satisfaction_froid_client: 'satisfaction-froid-client',
	evaluation_transfert: 'evaluation-transfert',
	bilan_formateur: 'bilan-formateur'
};

/**
 * Send a formation-related email using a Postmark template.
 *
 * Uses /email/withTemplate instead of inline HTML. The template must
 * exist in Postmark (created via scripts/setup-postmark-templates.ts).
 */
export async function sendFormationTemplateEmail(
	payload: TemplateEmailPayload,
	formationId: string,
	meta: {
		type: string;
		recipientType: string;
		documentId?: string;
		createdBy: string;
	}
): Promise<SendEmailResult> {
	let postmarkMessageId: string | undefined;
	let status = 'logged';
	let providerError: string | undefined;

	const postmarkToken = env.POSTMARK_SERVER_TOKEN;
	if (postmarkToken) {
		try {
			const model = {
				...payload.templateModel,
				showMentoreBranding: payload.templateModel.showMentoreBranding ?? true,
				siteUrl: payload.templateModel.siteUrl ?? env.PUBLIC_SITE_URL ?? 'https://app.mentoremanager.fr'
			};

			const postmarkPayload: Record<string, unknown> = {
				From: env.POSTMARK_FROM_EMAIL ?? 'noreply@mentoremanager.fr',
				To: payload.toName
					? `"${payload.toName.replace(/["\\]/g, '')}" <${payload.to}>`
					: payload.to,
				TemplateAlias: payload.templateAlias,
				TemplateModel: model,
				Tag: payload.tag ?? meta.type,
				TrackOpens: true,
				TrackLinks: 'HtmlAndText',
				MessageStream: 'outbound'
			};

			if (payload.attachments?.length) {
				postmarkPayload.Attachments = payload.attachments.map((a) => ({
					Name: a.filename,
					Content: a.content.toString('base64'),
					ContentType: a.contentType
				}));
			}

			const timeoutMs = getPostmarkFetchTimeoutMs();
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

			let response: Response;
			try {
				response = await fetch('https://api.postmarkapp.com/email/withTemplate', {
					method: 'POST',
					headers: {
						Accept: 'application/json',
						'Content-Type': 'application/json',
						'X-Postmark-Server-Token': postmarkToken
					},
					body: JSON.stringify(postmarkPayload),
					signal: controller.signal
				});
			} finally {
				clearTimeout(timeoutId);
			}

			if (response.ok) {
				const result = (await response.json()) as { MessageID?: string };
				postmarkMessageId = result.MessageID;
				const deliveryType = await getPostmarkServerDeliveryType();
				if (deliveryType === 'Sandbox') {
					status = 'sandbox';
					providerError = POSTMARK_SANDBOX_PROVIDER_HINT;
				} else {
					status = 'sent';
				}
			} else {
				const errorText = await response.text();
				console.error('Postmark template send failed:', errorText);
				status = 'failed';
				try {
					const j = JSON.parse(errorText) as { Message?: string };
					if (j.Message) providerError = j.Message;
				} catch {
					if (errorText) providerError = errorText.slice(0, 500);
				}
			}
		} catch (err) {
			if (isAbortError(err)) {
				console.error(
					`Postmark template send error: délai dépassé (${getPostmarkFetchTimeoutMs()} ms)`
				);
				providerError = `Délai dépassé (${getPostmarkFetchTimeoutMs()} ms)`;
			} else {
				console.error('Postmark template send error:', err);
				providerError = err instanceof Error ? err.message : 'Erreur réseau';
			}
			status = 'failed';
		}
	}

	const sendStatus: EmailSendStatus = status as EmailSendStatus;

	const subjectForLog = `[template:${payload.templateAlias}] ${meta.type}`;

	const [emailRecord] = await db
		.insert(formationEmails)
		.values({
			formationId,
			type: meta.type,
			subject: subjectForLog,
			recipientEmail: payload.to,
			recipientName: payload.toName ?? null,
			recipientType: meta.recipientType,
			status,
			sentAt: status === 'sent' ? new Date().toISOString() : null,
			postmarkMessageId: postmarkMessageId ?? null,
			bodyPreview: `template:${payload.templateAlias}`,
			documentId: meta.documentId ?? null,
			createdBy: meta.createdBy
		})
		.returning({ id: formationEmails.id });

	return {
		emailId: emailRecord.id,
		postmarkMessageId,
		sendStatus,
		...((sendStatus === 'failed' || sendStatus === 'sandbox') && providerError ? { providerError } : {})
	};
}
