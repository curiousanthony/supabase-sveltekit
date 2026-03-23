import { db } from '$lib/db';
import { formationEmails } from '$lib/db/schema';
import { env } from '$env/dynamic/private';

export interface EmailPayload {
	to: string;
	toName?: string;
	subject: string;
	htmlBody: string;
	textBody?: string;
	attachments?: { filename: string; content: Buffer; contentType: string }[];
	tag?: string;
}

export interface SendEmailResult {
	emailId: string;
	postmarkMessageId?: string;
}

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
				To: payload.toName ? `${payload.toName} <${payload.to}>` : payload.to,
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

			const response = await fetch('https://api.postmarkapp.com/email', {
				method: 'POST',
				headers: {
					Accept: 'application/json',
					'Content-Type': 'application/json',
					'X-Postmark-Server-Token': postmarkToken
				},
				body: JSON.stringify(postmarkPayload)
			});

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
			console.error('Postmark send error:', err);
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
 * Build a simple HTML email body from components.
 */
export function buildEmailHtml(options: {
	greeting: string;
	bodyLines: string[];
	ctaText?: string;
	ctaUrl?: string;
	signoff?: string;
	orgName?: string;
}): string {
	const { greeting, bodyLines, ctaText, ctaUrl, signoff, orgName } = options;

	const bodyHtml = bodyLines.map((line) => `<p style="margin:0 0 12px 0;">${line}</p>`).join('');

	const ctaHtml =
		ctaText && ctaUrl
			? `<p style="margin:24px 0;"><a href="${ctaUrl}" style="display:inline-block;padding:12px 24px;background-color:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">${ctaText}</a></p>`
			: '';

	return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a2e;max-width:600px;margin:0 auto;padding:20px;">
  <p style="font-size:16px;margin-bottom:16px;">${greeting}</p>
  ${bodyHtml}
  ${ctaHtml}
  <p style="margin-top:24px;">${signoff ?? 'Cordialement,'}</p>
  ${orgName ? `<p style="font-weight:600;">${orgName}</p>` : ''}
</body>
</html>`;
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

/**
 * Pre-built email templates for common formation emails.
 */
export const EMAIL_TEMPLATES = {
	convention_envoi: (formation: { name: string }, orgName: string) => ({
		subject: `Convention de formation — ${formation.name}`,
		html: buildEmailHtml({
			greeting: 'Bonjour,',
			bodyLines: [
				`Veuillez trouver ci-joint la convention de formation pour <strong>${formation.name}</strong>.`,
				'Merci de bien vouloir en prendre connaissance, la signer et nous la retourner dans les meilleurs délais.'
			],
			signoff: 'Cordialement,',
			orgName
		})
	}),

	convocation: (formation: { name: string; dateDebut: string | null }, learnerName: string, orgName: string) => ({
		subject: `Convocation — ${formation.name}`,
		html: buildEmailHtml({
			greeting: `Bonjour ${learnerName},`,
			bodyLines: [
				`Nous avons le plaisir de vous confirmer votre inscription à la formation <strong>${formation.name}</strong>.`,
				formation.dateDebut
					? `La formation débutera le <strong>${new Date(formation.dateDebut).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong>.`
					: '',
				'Veuillez trouver ci-joint votre convocation avec toutes les informations pratiques.'
			].filter(Boolean),
			signoff: 'Cordialement,',
			orgName
		})
	}),

	certificat_realisation: (formation: { name: string }, learnerName: string, orgName: string) => ({
		subject: `Certificat de réalisation — ${formation.name}`,
		html: buildEmailHtml({
			greeting: `Bonjour ${learnerName},`,
			bodyLines: [
				`Suite à votre participation à la formation <strong>${formation.name}</strong>, veuillez trouver ci-joint votre certificat de réalisation.`,
				'Ce document atteste de votre participation effective à l\'action de formation.'
			],
			signoff: 'Cordialement,',
			orgName
		})
	}),

	rappel_emargement: (formation: { name: string }, orgName: string) => ({
		subject: `Rappel — Signature d'émargement — ${formation.name}`,
		html: buildEmailHtml({
			greeting: 'Bonjour,',
			bodyLines: [
				`Nous vous rappelons de bien vouloir signer votre feuille d'émargement pour la formation <strong>${formation.name}</strong>.`,
				'Votre signature est obligatoire pour attester de votre présence.'
			],
			signoff: 'Cordialement,',
			orgName
		})
	})
} as const;
