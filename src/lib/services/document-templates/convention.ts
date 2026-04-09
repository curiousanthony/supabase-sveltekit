import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	type ClientData,
	SHARED_STYLES,
	formatDateFr,
	formatPdfCurrency,
	buildOrgHeader,
	buildSignatureBlock,
	buildReferralFooter
} from './shared';

export interface ConventionData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	client: ClientData;
	pricing: {
		prixTotal: number | null;
		prixParJour: number | null;
		nbParticipants: number | null;
	};
	modules: { name: string; duree: number | null }[];
}

export function buildConvention(data: ConventionData): TDocumentDefinitions {
	const { workspace, formation, client, pricing, modules } = data;

	const hasPricingData =
		pricing.prixTotal !== null ||
		pricing.prixParJour !== null ||
		pricing.nbParticipants !== null;

	// Article 1 is fixed (Objet). Increment for each optional block (objectifs, programme)
	// and for the remaining sections so numbering stays consistent when objectifs is absent.
	let articleIndex = 2;
	const objectifsArticleNumber = formation.objectifs ? articleIndex++ : undefined;
	const programmeArticleNumber = modules.length > 0 ? articleIndex++ : undefined;
	const moyensArticleNumber = articleIndex++;
	const conditionsArticleNumber = articleIndex++;
	const modalitesReglementArticleNumber = articleIndex++;
	const deduitArticleNumber = articleIndex++;
	const attestationArticleNumber = articleIndex++;
	const differendsArticleNumber = articleIndex++;

	const articlesContent = [
		{
			text: 'CONVENTION DE FORMATION PROFESSIONNELLE',
			style: 'header',
			alignment: 'center' as const,
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},
		{
			text: `Articles L.6353-1 et L.6353-2 du Code du travail`,
			style: 'small',
			alignment: 'center' as const,
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},

		{ text: 'ENTRE LES SOUSSIGNÉS', style: 'sectionTitle' },
		{
			text: [
				{ text: `${workspace.legalName ?? workspace.name ?? '—'}`, bold: true },
				`, organisme de formation`,
				workspace.nda ? `, déclaré sous le numéro ${workspace.nda}` : '',
				workspace.siret ? `, SIRET ${workspace.siret}` : '',
				workspace.address ? `, dont le siège social est situé ${workspace.address}` : '',
				workspace.city
					? ` ${workspace.postalCode ? workspace.postalCode + ' ' : ''}${workspace.city}`
					: '',
				`, ci-après dénommé "l'Organisme de Formation",`
			],
			style: 'body',
			margin: [0, 5, 0, 10] as [number, number, number, number]
		},
		{
			text: 'ET',
			style: 'body',
			alignment: 'center' as const,
			margin: [0, 5, 0, 10] as [number, number, number, number]
		},
		{
			text: [
				{ text: `${client.legalName ?? client.name}`, bold: true },
				client.siret ? `, SIRET ${client.siret}` : '',
				client.address ? `, dont le siège social est situé ${client.address}` : '',
				`, ci-après dénommé "le Client",`
			],
			style: 'body',
			margin: [0, 5, 0, 15] as [number, number, number, number]
		},

		{ text: 'IL EST CONVENU CE QUI SUIT :', style: 'sectionTitle' },

		{ text: 'Article 1 — Objet', style: 'subheader' },
		{
			text: `En exécution de la présente convention, l'Organisme de Formation s'engage à organiser l'action de formation suivante :`,
			style: 'body'
		},
		{
			table: {
				widths: ['30%', '*'],
				body: [
					[
						{ text: 'Intitulé', style: 'label' },
						{ text: formation.name, style: 'value' }
					],
					[
						{ text: 'Type', style: 'label' },
						{ text: formation.type ?? '—', style: 'value' }
					],
					[
						{ text: 'Modalité', style: 'label' },
						{ text: formation.modalite ?? '—', style: 'value' }
					],
					[
						{ text: 'Durée', style: 'label' },
						{ text: `${formation.duree ?? '—'} heures`, style: 'value' }
					],
					[
						{ text: 'Dates', style: 'label' },
						{
							text: `Du ${formatDateFr(formation.dateDebut)} au ${formatDateFr(formation.dateFin)}`,
							style: 'value'
						}
					],
					[
						{ text: 'Lieu', style: 'label' },
						{ text: formation.location ?? 'À définir', style: 'value' }
					]
				]
			},
			layout: 'lightHorizontalLines',
			margin: [0, 10, 0, 10] as [number, number, number, number]
		},

		...(formation.objectifs
			? [
					{
						text: `Article ${objectifsArticleNumber} — Objectifs pédagogiques`,
						style: 'subheader'
					},
					{ text: formation.objectifs, style: 'body' }
				]
			: []),

		...(modules.length > 0
			? [
					{ text: `Article ${programmeArticleNumber} — Programme`, style: 'subheader' },
					{
						table: {
							widths: ['*', '20%'],
							body: [
								[
									{ text: 'Module', style: 'label' },
									{ text: 'Durée', style: 'label' }
								],
								...modules.map((m) => [
									{ text: m.name, style: 'body' },
									{ text: m.duree ? `${m.duree}h` : '—', style: 'body' }
								])
							]
						},
						layout: 'lightHorizontalLines',
						margin: [0, 5, 0, 10] as [number, number, number, number]
					}
				]
			: []),

		{ text: `Article ${moyensArticleNumber} — Moyens pédagogiques`, style: 'subheader' },
		{
			text: `Les moyens pédagogiques et techniques mis en œuvre sont adaptés à la nature de la formation. L'Organisme de Formation met à disposition les supports pédagogiques nécessaires au bon déroulement de l'action.`,
			style: 'body'
		},

		{ text: `Article ${conditionsArticleNumber} — Conditions financières`, style: 'subheader' },
		hasPricingData
			? {
					table: {
						widths: ['40%', '*'],
						body: [
							...(pricing.prixTotal !== null
								? [
										[
											{ text: 'Coût total HT', style: 'label' },
											{ text: formatPdfCurrency(pricing.prixTotal), style: 'value' }
										]
									]
								: []),
							...(pricing.prixParJour !== null
								? [
										[
											{ text: 'Coût journalier HT', style: 'label' },
											{ text: formatPdfCurrency(pricing.prixParJour), style: 'value' }
										]
									]
								: []),
							...(pricing.nbParticipants !== null
								? [
										[
											{ text: 'Nombre de participants', style: 'label' },
											{ text: `${pricing.nbParticipants}`, style: 'value' }
										]
									]
								: [])
						]
					},
					layout: 'noBorders',
					margin: [0, 5, 0, 10] as [number, number, number, number]
				}
			: {
					text: 'Tarification : à définir',
					style: 'body',
					margin: [0, 5, 0, 10] as [number, number, number, number]
				},

		{ text: `Article ${modalitesReglementArticleNumber} — Modalités de règlement`, style: 'subheader' },
		{
			text: `Le règlement sera effectué à réception de facture, à l'issue de la formation, dans un délai de 30 jours.`,
			style: 'body'
		},

		{ text: `Article ${deduitArticleNumber} — Dédit ou abandon`, style: 'subheader' },
		{
			text: `En cas de dédit par le Client moins de 10 jours ouvrés avant le début de la formation, l'Organisme de Formation se réserve le droit de facturer 50% du montant total de la convention à titre de dédommagement. En cas d'abandon en cours de formation, le Client sera redevable de l'intégralité du coût de la formation.`,
			style: 'body'
		},

		{ text: `Article ${attestationArticleNumber} — Attestation`, style: 'subheader' },
		{
			text: `L'Organisme de Formation délivrera au stagiaire une attestation mentionnant les objectifs, la nature, la durée de l'action et les résultats de l'évaluation des acquis de la formation.`,
			style: 'body'
		},

		{ text: `Article ${differendsArticleNumber} — Différends`, style: 'subheader' },
		{
			text: `Si une contestation ou un différend ne peuvent être réglés à l'amiable, le Tribunal de commerce compétent sera saisi du litige.`,
			style: 'body'
		},

		{
			text: `\nFait en deux exemplaires, à ${workspace.city ?? '________'}, le ${formatDateFr(new Date().toISOString())}`,
			style: 'body',
			margin: [0, 20, 0, 0] as [number, number, number, number]
		},

		buildSignatureBlock(workspace, client.legalName ?? client.name),
		buildReferralFooter(workspace.showReferralCta)
	];

	return {
		content: [buildOrgHeader(workspace), ...articlesContent],
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Convention - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
