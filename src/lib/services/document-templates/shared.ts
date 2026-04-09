import type { Content, ContentColumns, StyleDictionary } from 'pdfmake/interfaces';

export interface WorkspaceIdentity {
	name: string | null;
	legalName: string | null;
	siret: string | null;
	address: string | null;
	city: string | null;
	postalCode: string | null;
	phone: string | null;
	email: string | null;
	website: string | null;
	nda: string | null;
	signatoryName: string | null;
	signatoryRole: string | null;
	showReferralCta: boolean;
	logoBase64: string | null;
	tvaRate: number;
	defaultPaymentTerms: string | null;
	defaultDevisValidityDays: number;
	defaultCancellationTerms: string | null;
}

export interface FormationData {
	name: string;
	description: string | null;
	dateDebut: string | null;
	dateFin: string | null;
	duree: number | null;
	modalite: string | null;
	location: string | null;
	type: string | null;
	objectifs: string | null;
	prerequis: string | null;
	publicVise: string | null;
}

export interface ClientData {
	name: string;
	legalName: string | null;
	siret: string | null;
	address: string | null;
}

export interface LearnerData {
	firstName: string | null;
	lastName: string | null;
	email: string | null;
}

export interface FormateurData {
	firstName: string | null;
	lastName: string | null;
	specialite: string | null;
}

/** IANA timezone for PDF date/time strings (servers often run UTC). */
export const PDF_TIMEZONE = 'Europe/Paris';

export const SHARED_STYLES: StyleDictionary = {
	header: { fontSize: 18, bold: true, margin: [0, 0, 0, 10] },
	subheader: { fontSize: 14, bold: true, margin: [0, 15, 0, 5] },
	sectionTitle: { fontSize: 12, bold: true, margin: [0, 10, 0, 5], color: '#1a1a2e' },
	body: { fontSize: 10, lineHeight: 1.4 },
	small: { fontSize: 8, color: '#666666' },
	label: { fontSize: 9, bold: true, color: '#555555' },
	value: { fontSize: 10 },
	footer: { fontSize: 8, color: '#999999', alignment: 'center' as const }
};

export function formatDateFr(isoDate: string | null): string {
	if (!isoDate) return '—';
	const date = new Date(isoDate);
	if (isNaN(date.getTime())) return '—';
	return date.toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric',
		timeZone: PDF_TIMEZONE
	});
}

/** Time portion for PDFs (e.g. signature blocks). */
export function formatTimeFr(iso: string): string {
	return new Date(iso).toLocaleTimeString('fr-FR', {
		hour: '2-digit',
		minute: '2-digit',
		timeZone: PDF_TIMEZONE
	});
}

/**
 * French euro amounts for PDF text. Normalizes narrow no-break space (U+202F) to ASCII space
 * so Helvetica in pdfmake does not render thousands separators as wrong glyphs.
 */
export function formatPdfCurrency(amount: number): string {
	const formatted = new Intl.NumberFormat('fr-FR', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(amount);
	return formatted.replace(/\u202f/g, ' ').replace(/\u00a0/g, ' ');
}

export function fullName(firstName: string | null, lastName: string | null): string {
	return [firstName, lastName].filter(Boolean).join(' ') || '—';
}

export function buildOrgHeader(ws: WorkspaceIdentity): Content {
	const headerParts: Content[] = [];

	if (ws.logoBase64) {
		headerParts.push({
			image: ws.logoBase64,
			width: 80,
			margin: [0, 0, 15, 0]
		});
	}

	const orgLines: string[] = [];
	if (ws.legalName || ws.name) orgLines.push(ws.legalName ?? ws.name ?? '');
	if (ws.address) orgLines.push(ws.address);
	if (ws.postalCode || ws.city) orgLines.push([ws.postalCode, ws.city].filter(Boolean).join(' '));
	if (ws.phone) orgLines.push(`Tél : ${ws.phone}`);
	if (ws.email) orgLines.push(`Email : ${ws.email}`);
	if (ws.siret) orgLines.push(`SIRET : ${ws.siret}`);
	if (ws.nda) orgLines.push(`NDA : ${ws.nda}`);

	headerParts.push({
		text: orgLines.join('\n'),
		style: 'small',
		margin: [0, 0, 0, 0]
	});

	return {
		columns: headerParts as ContentColumns['columns'],
		margin: [0, 0, 0, 20]
	};
}

export function buildSignatureBlock(ws: WorkspaceIdentity, clientName?: string): Content {
	const cols: Content[] = [
		{
			width: '*',
			stack: [
				{ text: "Pour l'organisme de formation", style: 'label', margin: [0, 0, 0, 3] },
				{ text: ws.legalName ?? ws.name ?? '', style: 'value' },
				...(ws.signatoryName ? [{ text: ws.signatoryName, style: 'value' }] : []),
				...(ws.signatoryRole ? [{ text: ws.signatoryRole, style: 'small' }] : []),
				{ text: '\n\nDate et signature :', style: 'small', margin: [0, 5, 0, 0] },
				{ text: '\n\n\n', style: 'body' }
			]
		}
	];

	if (clientName) {
		cols.push({
			width: '*',
			stack: [
				{ text: 'Pour le client', style: 'label', margin: [0, 0, 0, 3] },
				{ text: clientName, style: 'value' },
				{ text: '\n\nDate et signature :', style: 'small', margin: [0, 5, 0, 0] },
				{ text: '\n\n\n', style: 'body' }
			]
		});
	}

	return {
		columns: cols as ContentColumns['columns'],
		columnGap: 40,
		margin: [0, 30, 0, 0]
	};
}

export function buildReferralFooter(show: boolean): Content {
	if (!show) return { text: '' };
	return {
		text: 'Document généré avec Mentore Manager — mentoremanager.fr',
		style: 'footer',
		margin: [0, 20, 0, 0]
	};
}

export function buildArticleList(items: string[]): Content {
	return {
		ul: items,
		style: 'body',
		margin: [0, 5, 0, 5]
	};
}
