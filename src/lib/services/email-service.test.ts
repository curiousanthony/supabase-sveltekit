import { describe, it, expect, vi, beforeEach } from 'vitest';

let mockFetch: ReturnType<typeof vi.fn>;
let mockDbInsert: ReturnType<typeof vi.fn>;

vi.mock('$env/dynamic/private', () => ({
	env: {
		POSTMARK_SERVER_TOKEN: 'test-token',
		POSTMARK_FROM_EMAIL: 'test@example.com',
		PUBLIC_SITE_URL: 'https://app.test.com'
	}
}));

const returningFn = vi.fn().mockResolvedValue([{ id: 'email-record-id' }]);
const valuesFn = vi.fn().mockReturnValue({ returning: returningFn });
mockDbInsert = vi.fn().mockReturnValue({ values: valuesFn });

vi.mock('$lib/db', () => ({
	db: {
		insert: (...args: unknown[]) => mockDbInsert(...args)
	}
}));

vi.mock('$lib/db/schema', () => ({
	formationEmails: Symbol('formationEmails')
}));

mockFetch = vi.fn();
globalThis.fetch = mockFetch;

const {
	EMAIL_TYPE_TO_TEMPLATE,
	sendFormationTemplateEmail
} = await import('$lib/services/email-service');

describe('EMAIL_TYPE_TO_TEMPLATE', () => {
	it('maps all 22 email types to template aliases', () => {
		const expectedTypes = [
			'analyse_besoins',
			'analyse_besoins_resultats',
			'devis_envoi',
			'convention_envoi',
			'convocation',
			'reglement_interieur',
			'test_positionnement',
			'ordre_mission_envoi',
			'relance_documents_formateur',
			'emargement_link',
			'emargement_link_formateur',
			'rappel_emargement',
			'notification_absence',
			'satisfaction_chaud',
			'satisfaction_chaud_client',
			'certificat_realisation',
			'attestation_fin_formation',
			'facture_envoi',
			'satisfaction_froid',
			'satisfaction_froid_client',
			'evaluation_transfert',
			'bilan_formateur'
		];

		for (const type of expectedTypes) {
			expect(EMAIL_TYPE_TO_TEMPLATE).toHaveProperty(type);
			expect(typeof EMAIL_TYPE_TO_TEMPLATE[type]).toBe('string');
			expect(EMAIL_TYPE_TO_TEMPLATE[type].length).toBeGreaterThan(0);
		}
	});

	it('aliases use kebab-case', () => {
		for (const alias of Object.values(EMAIL_TYPE_TO_TEMPLATE)) {
			expect(alias).toMatch(/^[a-z][a-z0-9-]*$/);
		}
	});
});

describe('sendFormationTemplateEmail', () => {
	beforeEach(() => {
		mockFetch.mockReset();
		mockDbInsert.mockClear();
		valuesFn.mockClear();
		returningFn.mockClear().mockResolvedValue([{ id: 'email-record-id' }]);
	});

	it('sends via /email/withTemplate with correct alias and model', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ MessageID: 'pm-msg-123' })
		});

		const result = await sendFormationTemplateEmail(
			{
				to: 'learner@test.com',
				toName: 'Jean',
				templateAlias: 'emargement-apprenant',
				templateModel: {
					recipientName: 'Jean',
					formationName: 'Test Formation',
					sessionDate: 'lundi 7 avril 2026',
					ctaUrl: 'https://app.test.com/emargement/token123'
				},
				tag: 'emargement_link'
			},
			'formation-id-123',
			{ type: 'emargement_link', recipientType: 'apprenant', createdBy: 'user-id' }
		);

		expect(mockFetch).toHaveBeenCalledTimes(1);
		const [url, options] = mockFetch.mock.calls[0];
		expect(url).toBe('https://api.postmarkapp.com/email/withTemplate');

		const body = JSON.parse(options.body);
		expect(body.TemplateAlias).toBe('emargement-apprenant');
		expect(body.TemplateModel.recipientName).toBe('Jean');
		expect(body.TemplateModel.formationName).toBe('Test Formation');
		expect(body.TemplateModel.ctaUrl).toBe('https://app.test.com/emargement/token123');
		expect(body.From).toBe('test@example.com');
		expect(body.To).toContain('learner@test.com');
		expect(body.Tag).toBe('emargement_link');
		expect(body.TrackOpens).toBe(true);

		expect(result.postmarkMessageId).toBe('pm-msg-123');
		expect(result.emailId).toBe('email-record-id');
	});

	it('logs to formation_emails with status sent on success', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ MessageID: 'pm-msg-456' })
		});

		await sendFormationTemplateEmail(
			{
				to: 'test@test.com',
				templateAlias: 'satisfaction-chaud',
				templateModel: { recipientName: 'Test', formationName: 'F1' },
				tag: 'satisfaction_chaud'
			},
			'formation-id',
			{ type: 'satisfaction_chaud', recipientType: 'apprenant', createdBy: 'user-id' }
		);

		expect(valuesFn).toHaveBeenCalledTimes(1);
		const insertedValues = valuesFn.mock.calls[0][0];
		expect(insertedValues.status).toBe('sent');
		expect(insertedValues.postmarkMessageId).toBe('pm-msg-456');
		expect(insertedValues.recipientEmail).toBe('test@test.com');
	});

	it('sets status to failed when Postmark returns error', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: false,
			status: 500,
			text: async () => 'Server Error'
		});

		await sendFormationTemplateEmail(
			{
				to: 'test@test.com',
				templateAlias: 'devis-envoi',
				templateModel: { recipientName: 'Test', formationName: 'F1' }
			},
			'formation-id',
			{ type: 'devis_envoi', recipientType: 'client', createdBy: 'user-id' }
		);

		const insertedValues = valuesFn.mock.calls[0][0];
		expect(insertedValues.status).toBe('failed');
	});

	it('includes showMentoreBranding and siteUrl in template model', async () => {
		mockFetch.mockResolvedValueOnce({
			ok: true,
			json: async () => ({ MessageID: 'pm-msg-789' })
		});

		await sendFormationTemplateEmail(
			{
				to: 'test@test.com',
				templateAlias: 'convocation',
				templateModel: { recipientName: 'Test', formationName: 'F1' }
			},
			'formation-id',
			{ type: 'convocation', recipientType: 'apprenant', createdBy: 'user-id' }
		);

		const body = JSON.parse(mockFetch.mock.calls[0][1].body);
		expect(body.TemplateModel.showMentoreBranding).toBe(true);
		expect(body.TemplateModel.siteUrl).toBe('https://app.test.com');
	});
});

