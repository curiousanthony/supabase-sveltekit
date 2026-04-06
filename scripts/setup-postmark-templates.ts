/**
 * Postmark Layout & Templates Setup Script
 *
 * Creates (or updates) the Mentore Manager email layout and all 22
 * standard templates in the configured Postmark server.
 *
 * Usage:  bun run scripts/setup-postmark-templates.ts
 *
 * Requires POSTMARK_SERVER_TOKEN in .env (Bun auto-loads it).
 * Idempotent: safe to re-run — existing templates are updated by alias.
 */

const POSTMARK_API = 'https://api.postmarkapp.com';
const TOKEN = process.env.POSTMARK_SERVER_TOKEN;

if (!TOKEN) {
	console.error('POSTMARK_SERVER_TOKEN is not set. Add it to your .env file.');
	process.exit(1);
}

const headers = {
	Accept: 'application/json',
	'Content-Type': 'application/json',
	'X-Postmark-Server-Token': TOKEN
};

// ---------------------------------------------------------------------------
// Postmark API helpers
// ---------------------------------------------------------------------------

async function postmarkGet(path: string) {
	const res = await fetch(`${POSTMARK_API}${path}`, { headers });
	if (!res.ok && res.status !== 404 && res.status !== 422) {
		throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`);
	}
	const notFound = res.status === 404 || res.status === 422;
	return { status: notFound ? 404 : res.status, data: !notFound ? await res.json() : null };
}

async function postmarkPost(path: string, body: Record<string, unknown>) {
	const res = await fetch(`${POSTMARK_API}${path}`, {
		method: 'POST',
		headers,
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`POST ${path} → ${res.status}: ${text}`);
	}
	return res.json();
}

async function postmarkPut(path: string, body: Record<string, unknown>) {
	const res = await fetch(`${POSTMARK_API}${path}`, {
		method: 'PUT',
		headers,
		body: JSON.stringify(body)
	});
	if (!res.ok) {
		const text = await res.text();
		throw new Error(`PUT ${path} → ${res.status}: ${text}`);
	}
	return res.json();
}

async function upsertTemplate(template: {
	Alias: string;
	Name: string;
	Subject?: string;
	HtmlBody: string;
	TextBody: string;
	TemplateType: 'Standard' | 'Layout';
	LayoutTemplate?: string;
}) {
	const { status } = await postmarkGet(`/templates/${template.Alias}`);
	if (status === 404) {
		console.log(`  + Creating "${template.Alias}"…`);
		await postmarkPost('/templates', template);
	} else {
		console.log(`  ↻ Updating "${template.Alias}"…`);
		await postmarkPut(`/templates/${template.Alias}`, template);
	}
}

// ---------------------------------------------------------------------------
// Layout HTML
// ---------------------------------------------------------------------------

const LAYOUT_ALIAS = 'mentore-manager';

const layoutHtml = `<div style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Circular Std',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1a1a2e;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;">
    <tr>
      <td align="center" style="padding:32px 16px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding:36px 32px 28px;font-family:'Circular Std',ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
              {{{ @content }}}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #e5e7eb;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 24px;">
              {{#workspaceLogoUrl}}<img src="{{workspaceLogoUrl}}" alt="{{workspaceName}}" width="140" style="display:block;border:0;outline:none;margin-bottom:10px;" />{{/workspaceLogoUrl}}
              <p style="margin:0;font-size:13px;line-height:1.5;color:#6b7280;font-family:'Circular Std',ui-sans-serif,system-ui,sans-serif;">{{workspaceName}}</p>
              {{#workspaceAddress}}<p style="margin:2px 0 0;font-size:12px;line-height:1.5;color:#9ca3af;font-family:'Circular Std',ui-sans-serif,system-ui,sans-serif;">{{workspaceAddress}}</p>{{/workspaceAddress}}
            </td>
          </tr>
        </table>
        <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center;font-family:'Circular Std',ui-sans-serif,system-ui,sans-serif;">Cet e-mail a été envoyé automatiquement. Veuillez ne pas y répondre directement.</p>
        {{#showMentoreBranding}}<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:12px auto 0;" align="center">
          <tr>
            <td align="center" style="vertical-align:middle;">
              <img src="{{siteUrl}}/email/mentore-manager-logo.png" alt="Mentore Manager" width="90" height="19" style="display:block;border:0;outline:none;" />
            </td>
          </tr>
        </table>{{/showMentoreBranding}}
      </td>
    </tr>
  </table>
</div>`;

const layoutText = '{{{ @content }}}';

// ---------------------------------------------------------------------------
// CTA button helper (used in template definitions below)
// ---------------------------------------------------------------------------

const ctaButton = (text: string) =>
	`<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 12px;"><tr><td align="center" style="border-radius:8px;background-color:#EE2B47;"><a href="{{ctaUrl}}" target="_blank" style="display:inline-block;padding:13px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;background-color:#EE2B47;font-family:'Circular Std',ui-sans-serif,system-ui,sans-serif;">${text}</a></td></tr></table>`;

const p = (text: string) =>
	`<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">${text}</p>`;

const greeting =
	'<p style="margin:0 0 16px;font-size:16px;line-height:1.5;color:#1a1a2e;">Bonjour {{recipientName}},</p>';

// ---------------------------------------------------------------------------
// 22 Templates
// ---------------------------------------------------------------------------

interface TemplateDef {
	alias: string;
	name: string;
	subject: string;
	htmlBody: string;
	textBody: string;
}

const templates: TemplateDef[] = [
	// ── Pre-formation ────────────────────────────────────────────────────

	{
		alias: 'analyse-besoins',
		name: 'Analyse des besoins',
		subject: 'Analyse des besoins — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Pour bien préparer <strong>{{formationName}}</strong>, merci de répondre à notre questionnaire d'analyse des besoins (quelques minutes).`),
			`{{#ctaUrl}}${ctaButton('Répondre au questionnaire')}{{/ctaUrl}}`,
			p('Bonne préparation !'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nPour bien préparer {{formationName}}, merci de répondre à notre questionnaire d'analyse des besoins (quelques minutes).\n\n{{#ctaUrl}}Répondre au questionnaire : {{ctaUrl}}\n\n{{/ctaUrl}}Bonne préparation !\n\nBien cordialement,\n{{workspaceName}}`
	},
	{
		alias: 'analyse-besoins-resultats',
		name: 'Résultats analyse des besoins',
		subject: 'Résultats analyse des besoins — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Les réponses au questionnaire pour <strong>{{formationName}}</strong> sont disponibles. Un coup d'œil avant la session vous permettra d'ajuster le contenu si besoin.`),
			`{{#ctaUrl}}${ctaButton('Voir les résultats')}{{/ctaUrl}}`,
			p('À bientôt !'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nLes réponses au questionnaire pour {{formationName}} sont disponibles. Un coup d'œil avant la session vous permettra d'ajuster le contenu si besoin.\n\n{{#ctaUrl}}Voir les résultats : {{ctaUrl}}\n\n{{/ctaUrl}}À bientôt !\n\nBien cordialement,\n{{workspaceName}}`
	},
	{
		alias: 'devis-envoi',
		name: 'Envoi de devis',
		subject: 'Devis — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous trouverez ci-dessous notre proposition pour <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('Le devis est joint à ce message.')}{{/hasAttachment}}`,
			p('Nous restons disponibles pour en parler.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous trouverez ci-dessous notre proposition pour {{formationName}}.\n\n{{#hasAttachment}}Le devis est joint à ce message.\n\n{{/hasAttachment}}Nous restons disponibles pour en parler.\n\nCordialement,\n{{workspaceName}}`
	},
	{
		alias: 'convention-envoi',
		name: 'Envoi de convention',
		subject: 'Convention — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Nous vous adressons la convention relative à <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('Le document est en pièce jointe ; merci de nous le retourner signé selon les modalités indiquées.')}{{/hasAttachment}}`,
			p('Une question ? Répondez à cet e-mail.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien à vous,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nNous vous adressons la convention relative à {{formationName}}.\n\n{{#hasAttachment}}Le document est en pièce jointe ; merci de nous le retourner signé selon les modalités indiquées.\n\n{{/hasAttachment}}Une question ? Répondez à cet e-mail.\n\nBien à vous,\n{{workspaceName}}`
	},
	{
		alias: 'convocation',
		name: 'Convocation',
		subject: 'Convocation — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous êtes convoqué(e) à la formation <strong>{{formationName}}</strong>, le <strong>{{sessionDate}}</strong>.`),
			`{{#hasAttachment}}${p('Modalités pratiques et documents utiles : voir les pièces jointes.')}{{/hasAttachment}}`,
			p("En cas d'empêchement, prévenez-nous sans tarder."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">À bientôt,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous êtes convoqué(e) à la formation {{formationName}}, le {{sessionDate}}.\n\n{{#hasAttachment}}Modalités pratiques et documents utiles : voir les pièces jointes.\n\n{{/hasAttachment}}En cas d'empêchement, prévenez-nous sans tarder.\n\nÀ bientôt,\n{{workspaceName}}`
	},
	{
		alias: 'reglement-interieur',
		name: 'Règlement intérieur',
		subject: 'Règlement intérieur — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Conformément à nos engagements pour <strong>{{formationName}}</strong>, nous vous transmettons notre règlement intérieur.`),
			`{{#hasAttachment}}${p('Document en pièce jointe.')}{{/hasAttachment}}`,
			p("Merci d'en prendre connaissance avant le démarrage."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nConformément à nos engagements pour {{formationName}}, nous vous transmettons notre règlement intérieur.\n\n{{#hasAttachment}}Document en pièce jointe.\n\n{{/hasAttachment}}Merci d'en prendre connaissance avant le démarrage.\n\nCordialement,\n{{workspaceName}}`
	},
	{
		alias: 'test-positionnement',
		name: 'Test de positionnement',
		subject: 'Test de positionnement — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Avant le début de <strong>{{formationName}}</strong>, merci de passer le test de positionnement. Cela nous aide à calibrer le groupe.`),
			`{{#ctaUrl}}${ctaButton('Passer le test')}{{/ctaUrl}}`,
			p("Merci d'avance."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nAvant le début de {{formationName}}, merci de passer le test de positionnement. Cela nous aide à calibrer le groupe.\n\n{{#ctaUrl}}Passer le test : {{ctaUrl}}\n\n{{/ctaUrl}}Merci d'avance.\n\nBien cordialement,\n{{workspaceName}}`
	},
	{
		alias: 'ordre-mission-envoi',
		name: 'Envoi ordre de mission',
		subject: 'Ordre de mission — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous trouverez l'ordre de mission pour <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('Document joint à ce message.')}{{/hasAttachment}}`,
			p('Contactez-nous si quelque chose manque.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">À très vite,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous trouverez l'ordre de mission pour {{formationName}}.\n\n{{#hasAttachment}}Document joint à ce message.\n\n{{/hasAttachment}}Contactez-nous si quelque chose manque.\n\nÀ très vite,\n{{workspaceName}}`
	},
	{
		alias: 'relance-documents-formateur',
		name: 'Relance documents formateur',
		subject: 'Documents manquants — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Petit rappel : pour <strong>{{formationName}}</strong>, il nous manque encore des documents de votre part.`),
			p('Dès réception, on finalise le dossier côté organisme.'),
			p('Merci !'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien cordialement,<br><strong>{{workspaceName}}</strong></p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nPetit rappel : pour {{formationName}}, il nous manque encore des documents de votre part.\n\nDès réception, on finalise le dossier côté organisme.\n\nMerci !\n\nBien cordialement,\n{{workspaceName}}`
	},

	// ── During formation ─────────────────────────────────────────────────

	{
		alias: 'emargement-apprenant',
		name: 'Émargement apprenant',
		subject: 'Émargement à signer — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Votre feuille d'émargement pour la session du <strong>{{sessionDate}}</strong> de la formation <strong>{{formationName}}</strong> est prête. Une signature suffit pour valider votre présence.`),
			p('Merci de signer dès que possible.'),
			`{{#ctaUrl}}${ctaButton('Signer mon émargement')}{{/ctaUrl}}`,
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">À bientôt,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVotre feuille d'émargement pour la session du {{sessionDate}} de la formation {{formationName}} est prête. Une signature suffit pour valider votre présence.\n\nMerci de signer dès que possible.\n\n{{#ctaUrl}}Signer : {{ctaUrl}}\n\n{{/ctaUrl}}À bientôt,\n{{workspaceName}}`
	},
	{
		alias: 'emargement-formateur',
		name: 'Émargement formateur',
		subject: 'Émargement formateur — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Votre feuille d'émargement pour la session du <strong>{{sessionDate}}</strong> (<strong>{{formationName}}</strong>) est disponible. Signez pour confirmer votre intervention.`),
			`{{#ctaUrl}}${ctaButton('Signer mon émargement')}{{/ctaUrl}}`,
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Merci,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVotre feuille d'émargement pour la session du {{sessionDate}} ({{formationName}}) est disponible. Signez pour confirmer votre intervention.\n\n{{#ctaUrl}}Signer : {{ctaUrl}}\n\n{{/ctaUrl}}Merci,\n{{workspaceName}}`
	},
	{
		alias: 'rappel-emargement',
		name: 'Rappel émargement',
		subject: 'Rappel — émargement {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous n'avez pas encore signé l'émargement pour <strong>{{formationName}}</strong>. Sans signature, votre présence peut rester non validée.`),
			p('Quelques secondes suffisent.'),
			`{{#ctaUrl}}${ctaButton('Signer maintenant')}{{/ctaUrl}}`,
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Cordialement,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous n'avez pas encore signé l'émargement pour {{formationName}}. Sans signature, votre présence peut rester non validée.\n\nQuelques secondes suffisent.\n\n{{#ctaUrl}}Signer : {{ctaUrl}}\n\n{{/ctaUrl}}Cordialement,\n{{workspaceName}}`
	},
	{
		alias: 'notification-absence',
		name: 'Notification absence',
		subject: 'Absences enregistrées — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Des absences ont été enregistrées pour vos collaborateurs pendant la formation <strong>{{formationName}}</strong>. Vous pouvez consulter le détail dans votre espace ou contacter l'organisme si vous avez une question.`),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien à vous,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nDes absences ont été enregistrées pour vos collaborateurs pendant la formation {{formationName}}. Vous pouvez consulter le détail dans votre espace ou contacter l'organisme si vous avez une question.\n\nBien à vous,\n{{workspaceName}}`
	},

	// ── Post-formation ───────────────────────────────────────────────────

	{
		alias: 'satisfaction-chaud',
		name: 'Satisfaction à chaud',
		subject: 'Votre avis sur {{formationName}} ?',
		htmlBody: [
			greeting,
			p(`La formation <strong>{{formationName}}</strong> est terminée. Deux minutes suffisent pour nous dire ce qui a bien fonctionné — et ce qu'on peut ajuster.`),
			`{{#ctaUrl}}${ctaButton('Donner mon avis')}{{/ctaUrl}}`,
			p("Merci d'avance."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">L'équipe {{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nLa formation {{formationName}} est terminée. Deux minutes suffisent pour nous dire ce qui a bien fonctionné — et ce qu'on peut ajuster.\n\n{{#ctaUrl}}Donner mon avis : {{ctaUrl}}\n\n{{/ctaUrl}}Merci d'avance.\n\nL'équipe {{workspaceName}}`
	},
	{
		alias: 'satisfaction-chaud-client',
		name: 'Satisfaction à chaud (client)',
		subject: 'Retour sur {{formationName}}',
		htmlBody: [
			greeting,
			p(`La formation <strong>{{formationName}}</strong>, suivie par vos collaborateurs, est close. Votre regard nous aide à garder le cap sur vos attentes.`),
			`{{#ctaUrl}}${ctaButton('Donner mon avis')}{{/ctaUrl}}`,
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien à vous,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nLa formation {{formationName}}, suivie par vos collaborateurs, est close. Votre regard nous aide à garder le cap sur vos attentes.\n\n{{#ctaUrl}}Donner mon avis : {{ctaUrl}}\n\n{{/ctaUrl}}Bien à vous,\n{{workspaceName}}`
	},
	{
		alias: 'certificat-realisation',
		name: 'Certificat de réalisation',
		subject: 'Votre certificat — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous trouverez ci-joint votre <strong>certificat de réalisation</strong> pour la formation <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('Le document est en pièce jointe.')}{{/hasAttachment}}`,
			p('Bravo pour le parcours.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous trouverez ci-joint votre certificat de réalisation pour la formation {{formationName}}.\n\n{{#hasAttachment}}Le document est en pièce jointe.\n\n{{/hasAttachment}}Bravo pour le parcours.\n\n{{workspaceName}}`
	},
	{
		alias: 'attestation-fin-formation',
		name: 'Attestation fin de formation',
		subject: 'Attestation de fin de formation — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Vous trouverez ci-joint votre <strong>attestation de fin de formation</strong> pour <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('Le PDF est joint à cet e-mail.')}{{/hasAttachment}}`,
			p("On reste à votre écoute si besoin."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Cordialement,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVous trouverez ci-joint votre attestation de fin de formation pour {{formationName}}.\n\n{{#hasAttachment}}Le PDF est joint à cet e-mail.\n\n{{/hasAttachment}}On reste à votre écoute si besoin.\n\nCordialement,\n{{workspaceName}}`
	},
	{
		alias: 'facture-envoi',
		name: 'Envoi de facture',
		subject: 'Facture — {{formationName}}',
		htmlBody: [
			greeting,
			p(`Veuillez trouver ci-joint notre facture pour la formation <strong>{{formationName}}</strong>.`),
			`{{#hasAttachment}}${p('La facture est en pièce jointe.')}{{/hasAttachment}}`,
			p('Pour toute question comptable, répondez directement à cet e-mail.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nVeuillez trouver ci-joint notre facture pour la formation {{formationName}}.\n\n{{#hasAttachment}}La facture est en pièce jointe.\n\n{{/hasAttachment}}Pour toute question comptable, répondez directement à cet e-mail.\n\n{{workspaceName}}`
	},

	// ── Follow-up ────────────────────────────────────────────────────────

	{
		alias: 'satisfaction-froid',
		name: 'Satisfaction à froid',
		subject: 'Formation {{formationName}} : votre retour compte',
		htmlBody: [
			greeting,
			p(`Il y a quelques mois, vous aviez suivi <strong>{{formationName}}</strong>. Aujourd'hui, qu'est-ce qui vous reste le plus utile au quotidien ?`),
			p('Quelques questions suffisent pour nous aider à ajuster nos contenus.'),
			`{{#ctaUrl}}${ctaButton('Répondre au questionnaire')}{{/ctaUrl}}`,
			p("Merci d'avance."),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">À bientôt,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nIl y a quelques mois, vous aviez suivi {{formationName}}. Aujourd'hui, qu'est-ce qui vous reste le plus utile au quotidien ?\n\nQuelques questions suffisent pour nous aider à ajuster nos contenus.\n\n{{#ctaUrl}}Répondre au questionnaire : {{ctaUrl}}\n\n{{/ctaUrl}}Merci d'avance.\n\nÀ bientôt,\n{{workspaceName}}`
	},
	{
		alias: 'satisfaction-froid-client',
		name: 'Satisfaction à froid (client)',
		subject: 'Impact de {{formationName}} chez vos équipes ?',
		htmlBody: [
			greeting,
			p(`La formation <strong>{{formationName}}</strong> date de quelques mois. Chez vous, quel effet voyez-vous sur le terrain : pratiques, autonomie, résultats ?`),
			p('Votre regard nous aide à calibrer nos actions et nos suivis.'),
			`{{#ctaUrl}}${ctaButton('Donner mon avis')}{{/ctaUrl}}`,
			p('Merci pour votre temps.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Cordialement,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nLa formation {{formationName}} date de quelques mois. Chez vous, quel effet voyez-vous sur le terrain : pratiques, autonomie, résultats ?\n\nVotre regard nous aide à calibrer nos actions et nos suivis.\n\n{{#ctaUrl}}Donner mon avis : {{ctaUrl}}\n\n{{/ctaUrl}}Merci pour votre temps.\n\nCordialement,\n{{workspaceName}}`
	},
	{
		alias: 'evaluation-transfert',
		name: 'Évaluation du transfert',
		subject: 'Transfert en situation : {{formationName}}',
		htmlBody: [
			greeting,
			p(`Après <strong>{{formationName}}</strong>, comment appliquez-vous concrètement ce que vous avez vu en formation, au fil des semaines ?`),
			p("Votre retour honnête nous sert à renforcer l'efficacité des prochains groupes."),
			`{{#ctaUrl}}${ctaButton('Évaluer le transfert')}{{/ctaUrl}}`,
			p('Merci.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Bien à vous,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nAprès {{formationName}}, comment appliquez-vous concrètement ce que vous avez vu en formation, au fil des semaines ?\n\nVotre retour honnête nous sert à renforcer l'efficacité des prochains groupes.\n\n{{#ctaUrl}}Évaluer le transfert : {{ctaUrl}}\n\n{{/ctaUrl}}Merci.\n\nBien à vous,\n{{workspaceName}}`
	},
	{
		alias: 'bilan-formateur',
		name: 'Bilan formateur',
		subject: 'Bilan formateur — {{formationName}}',
		htmlBody: [
			greeting,
			p(`La session <strong>{{formationName}}</strong> est passée : on a besoin de votre retour structuré (déroulé, public, points forts / à ajuster) pour clôturer le dossier côté organisme.`),
			p('Cela prend peu de temps et évite les allers-retours.'),
			`{{#ctaUrl}}${ctaButton('Rédiger mon bilan')}{{/ctaUrl}}`,
			p('Merci pour votre professionnalisme.'),
			`<p style="margin:24px 0 0;font-size:15px;line-height:1.6;color:#374151;">Au plaisir,<br>{{workspaceName}}</p>`
		].join('\n'),
		textBody: `Bonjour {{recipientName}},\n\nLa session {{formationName}} est passée : on a besoin de votre retour structuré (déroulé, public, points forts / à ajuster) pour clôturer le dossier côté organisme.\n\nCela prend peu de temps et évite les allers-retours.\n\n{{#ctaUrl}}Rédiger mon bilan : {{ctaUrl}}\n\n{{/ctaUrl}}Merci pour votre professionnalisme.\n\nAu plaisir,\n{{workspaceName}}`
	}
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
	console.log('Postmark Setup — Layout + Templates');
	console.log('====================================\n');

	// 1. Layout
	console.log('1. Layout');
	await upsertTemplate({
		Alias: LAYOUT_ALIAS,
		Name: 'Mentore Manager',
		HtmlBody: layoutHtml,
		TextBody: layoutText,
		TemplateType: 'Layout'
	});
	console.log();

	// 2. Standard templates
	console.log(`2. Templates (${templates.length})`);
	for (const t of templates) {
		await upsertTemplate({
			Alias: t.alias,
			Name: t.name,
			Subject: t.subject,
			HtmlBody: t.htmlBody,
			TextBody: t.textBody,
			TemplateType: 'Standard',
			LayoutTemplate: LAYOUT_ALIAS
		});
	}

	console.log(`\nDone — 1 layout + ${templates.length} templates synced.`);
}

main().catch((err) => {
	console.error('Fatal error:', err);
	process.exit(1);
});
