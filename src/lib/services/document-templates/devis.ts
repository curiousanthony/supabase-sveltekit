import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	type ClientData,
	SHARED_STYLES,
	formatDateFr,
	buildOrgHeader,
	buildSignatureBlock,
	buildReferralFooter
} from './shared';

export interface DevisData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	client: ClientData;
	pricing: {
		prixHT: number;
		tvaRate: number;
		tva: number;
		prixTTC: number;
		prixParJour: number | null;
		nbParticipants: number | null;
	};
	validityDays: number;
	paymentTerms: string | null;
	cancellationTerms: string | null;
	modules: { name: string; duree: number | null }[];
	generatedAt: string;
}

function formatCurrency(n: number): string {
	return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function buildDevis(data: DevisData): TDocumentDefinitions {
	const { workspace, formation, client, pricing, validityDays, paymentTerms, cancellationTerms, modules, generatedAt } = data;

	const validUntil = new Date(generatedAt);
	validUntil.setDate(validUntil.getDate() + validityDays);

	const pricingRows: Content[][] = [
		[{ text: 'Désignation', style: 'label', bold: true }, { text: 'Montant', style: 'label', bold: true, alignment: 'right' as const }],
		[
			{
				stack: [
					{ text: formation.name, style: 'body', bold: true },
					{ text: `Durée : ${formation.duree ?? '—'} heures`, style: 'small' },
					...(formation.modalite ? [{ text: `Modalité : ${formation.modalite}`, style: 'small' }] : []),
					...(pricing.nbParticipants ? [{ text: `Nombre de stagiaires : ${pricing.nbParticipants}`, style: 'small' }] : [])
				]
			},
			{ text: `${formatCurrency(pricing.prixHT)} €`, style: 'value', alignment: 'right' as const }
		]
	];

	const content: Content[] = [
		buildOrgHeader(workspace),

		{
			text: 'DEVIS',
			style: 'header',
			alignment: 'center' as const,
			margin: [0, 0, 0, 5] as [number, number, number, number]
		},
		{
			text: `Émis le ${formatDateFr(generatedAt)} — Valable jusqu'au ${formatDateFr(validUntil.toISOString())}`,
			style: 'small',
			alignment: 'center' as const,
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},

		{ text: 'Client', style: 'sectionTitle' },
		{
			text: [
				{ text: client.legalName ?? client.name, bold: true },
				...(client.siret ? [`, SIRET ${client.siret}`] : []),
				...(client.address ? [`\n${client.address}`] : [])
			],
			style: 'body',
			margin: [0, 0, 0, 15] as [number, number, number, number]
		},

		{ text: 'Action de formation', style: 'sectionTitle' },
		{
			table: {
				widths: ['30%', '*'],
				body: [
					[{ text: 'Intitulé', style: 'label' }, { text: formation.name, style: 'value', bold: true }],
					[{ text: 'Type', style: 'label' }, { text: formation.type ?? '—', style: 'value' }],
					[{ text: 'Modalité', style: 'label' }, { text: formation.modalite ?? '—', style: 'value' }],
					[{ text: 'Durée', style: 'label' }, { text: `${formation.duree ?? '—'} heures`, style: 'value' }],
					[{ text: 'Dates', style: 'label' }, { text: `Du ${formatDateFr(formation.dateDebut)} au ${formatDateFr(formation.dateFin)}`, style: 'value' }],
					[{ text: 'Lieu', style: 'label' }, { text: formation.location ?? 'À définir', style: 'value' }]
				]
			},
			layout: 'lightHorizontalLines',
			margin: [0, 5, 0, 15] as [number, number, number, number]
		},

		...(formation.objectifs
			? [
				{ text: 'Objectifs pédagogiques', style: 'sectionTitle' } as Content,
				{ text: formation.objectifs, style: 'body', margin: [0, 0, 0, 10] as [number, number, number, number] } as Content
			]
			: []),

		...(modules.length > 0
			? [
				{ text: 'Programme', style: 'sectionTitle' } as Content,
				{
					table: {
						widths: ['*', '20%'],
						body: [
							[{ text: 'Module', style: 'label' }, { text: 'Durée', style: 'label' }],
							...modules.map((m) => [
								{ text: m.name, style: 'body' },
								{ text: m.duree ? `${m.duree}h` : '—', style: 'body' }
							])
						]
					},
					layout: 'lightHorizontalLines',
					margin: [0, 5, 0, 15] as [number, number, number, number]
				} as Content
			]
			: []),

		...(formation.publicVise
			? [
				{ text: 'Public visé', style: 'sectionTitle' } as Content,
				{ text: formation.publicVise, style: 'body', margin: [0, 0, 0, 10] as [number, number, number, number] } as Content
			]
			: []),

		...(formation.prerequis
			? [
				{ text: 'Prérequis', style: 'sectionTitle' } as Content,
				{ text: formation.prerequis, style: 'body', margin: [0, 0, 0, 10] as [number, number, number, number] } as Content
			]
			: []),

		{ text: 'Tarification', style: 'sectionTitle' },
		{
			table: {
				headerRows: 1,
				widths: ['*', '30%'],
				body: pricingRows
			},
			layout: 'lightHorizontalLines',
			margin: [0, 5, 0, 5] as [number, number, number, number]
		},

		{
			table: {
				widths: ['*', '30%'],
				body: [
					...(pricing.prixParJour !== null
						? [[
							{ text: 'Prix par jour HT', style: 'small', alignment: 'right' as const },
							{ text: `${formatCurrency(pricing.prixParJour)} €`, style: 'small', alignment: 'right' as const }
						]]
						: []),
					[
						{ text: 'Total HT', style: 'label', alignment: 'right' as const },
						{ text: `${formatCurrency(pricing.prixHT)} €`, style: 'value', alignment: 'right' as const }
					],
					[
						{ text: `TVA (${pricing.tvaRate}%)`, style: 'label', alignment: 'right' as const },
						{ text: `${formatCurrency(pricing.tva)} €`, style: 'value', alignment: 'right' as const }
					],
					[
						{ text: 'Total TTC', style: 'label', bold: true, alignment: 'right' as const },
						{ text: `${formatCurrency(pricing.prixTTC)} €`, style: 'value', bold: true, alignment: 'right' as const }
					]
				]
			},
			layout: 'noBorders',
			margin: [0, 0, 0, 15] as [number, number, number, number]
		},

		{ text: 'Conditions de règlement', style: 'sectionTitle' },
		{
			text: paymentTerms ?? '30 jours fin de mois, par virement bancaire.',
			style: 'body',
			margin: [0, 0, 0, 10] as [number, number, number, number]
		},

		...(cancellationTerms
			? [
				{ text: "Conditions d'annulation", style: 'sectionTitle' } as Content,
				{ text: cancellationTerms, style: 'body', margin: [0, 0, 0, 10] as [number, number, number, number] } as Content
			]
			: [
				{ text: "Conditions d'annulation", style: 'sectionTitle' } as Content,
				{
					text: "En cas d'annulation par le client moins de 10 jours ouvrés avant le début de la formation, 50% du montant total sera dû à titre de dédommagement.",
					style: 'body',
					margin: [0, 0, 0, 10] as [number, number, number, number]
				} as Content
			]),

		{
			text: `Ce devis est valable ${validityDays} jours à compter de sa date d'émission.`,
			style: 'body',
			italics: true,
			margin: [0, 5, 0, 10] as [number, number, number, number]
		},

		{
			text: `\nFait à ${workspace.city ?? '________'}, le ${formatDateFr(generatedAt)}`,
			style: 'body',
			margin: [0, 10, 0, 0] as [number, number, number, number]
		},

		buildSignatureBlock(workspace, client.legalName ?? client.name),
		buildReferralFooter(workspace.showReferralCta)
	];

	return {
		content,
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Devis - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
