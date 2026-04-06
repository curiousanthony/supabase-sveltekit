import { db } from '$lib/db';
import { formationEmails } from '$lib/db/schema';
import { env } from '$env/dynamic/private';

const DEFAULT_POSTMARK_FETCH_TIMEOUT_MS = 30_000;

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

export interface EmailPayload {
	to: string;
	toName?: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
	attachments?: { filename: string; content: Buffer; contentType: string }[];
	tag?: string;
}

export interface TemplateEmailPayload {
	to: string;
	toName?: string;
	templateAlias: string;
	templateModel: Record<string, unknown>;
	attachments?: { filename: string; content: Buffer; contentType: string }[];
	tag?: string;
}

export interface SendEmailResult {
	emailId: string;
	postmarkMessageId?: string;
}

export const EMAIL_TYPE_TO_TEMPLATE: Record<string, string> = {
	analyse_besoins: 'analyse-besoins',
	analyse_besoins_resultats: 'analyse-besoins-resultats',
	devis_envoi: 'devis-envoi',
	convention_envoi: 'convention-envoi',
	convocation: 'convocation',
	reglement_interieur: 'reglement-interieur',
	test_positionnement: 'test-positionnement',
	ordre_mission_envoi: 'ordre-mission-envoi',
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
 * Send a formation-related email.
 *
 * Phase 1: Logs to `formation_emails` table and optionally sends via Postmark
 * if POSTMARK_SERVER_TOKEN is configured.
 */
export async function sendFormationEmail(
	payload: EmailPayload,
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

	const postmarkToken = env.POSTMARK_SERVER_TOKEN;
	if (postmarkToken) {
		try {
			const postmarkPayload: Record<string, unknown> = {
				From: env.POSTMARK_FROM_EMAIL ?? 'noreply@mentoremanager.fr',
				To: payload.toName
					? `"${payload.toName.replace(/["\\]/g, '')}" <${payload.to}>`
					: payload.to,
				Subject: payload.subject,
				HtmlBody: payload.htmlBody,
				TextBody: payload.textBody ?? stripHtml(payload.htmlBody),
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
				response = await fetch('https://api.postmarkapp.com/email', {
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
				status = 'sent';
			} else {
				const errorText = await response.text();
				console.error('Postmark send failed:', errorText);
				status = 'failed';
			}
		} catch (err) {
			if (isAbortError(err)) {
				console.error(
					`Postmark send error: délai dépassé (${getPostmarkFetchTimeoutMs()} ms, configurable via POSTMARK_FETCH_TIMEOUT_MS)`
				);
			} else {
				console.error('Postmark send error:', err);
			}
			status = 'failed';
		}
	}

	const [emailRecord] = await db
		.insert(formationEmails)
		.values({
			formationId,
			type: meta.type,
			subject: payload.subject,
			recipientEmail: payload.to,
			recipientName: payload.toName ?? null,
			recipientType: meta.recipientType,
			status,
			sentAt: status === 'sent' ? new Date().toISOString() : null,
			postmarkMessageId: postmarkMessageId ?? null,
			bodyPreview: payload.htmlBody.slice(0, 500),
			documentId: meta.documentId ?? null,
			createdBy: meta.createdBy
		})
		.returning({ id: formationEmails.id });

	return {
		emailId: emailRecord.id,
		postmarkMessageId
	};
}

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
				status = 'sent';
			} else {
				const errorText = await response.text();
				console.error('Postmark template send failed:', errorText);
				status = 'failed';
			}
		} catch (err) {
			if (isAbortError(err)) {
				console.error(
					`Postmark template send error: délai dépassé (${getPostmarkFetchTimeoutMs()} ms)`
				);
			} else {
				console.error('Postmark template send error:', err);
			}
			status = 'failed';
		}
	}

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
		postmarkMessageId
	};
}

function stripHtml(html: string): string {
	return html
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/p>/gi, '\n\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}
