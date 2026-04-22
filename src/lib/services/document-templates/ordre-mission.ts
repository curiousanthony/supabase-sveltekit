import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	SHARED_STYLES,
	formatDateFr,
	formatPdfCurrency,
	fullName,
	buildOrgHeader,
	buildSignatureBlock,
	buildReferralFooter
} from './shared';

export interface OrdreMissionData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	formateur: {
		firstName: string | null;
		lastName: string | null;
		specialite: string | null;
	};
	mission: {
		tjm: number | null;
		numberOfDays: number | null;
		deplacementCost: number | null;
		hebergementCost: number | null;
	};
	modules: { name: string; duree: number | null }[];
	generatedAt: string;
}

export function buildOrdreMission(data: OrdreMissionData): TDocumentDefinitions {
	const { workspace, formation, formateur, mission, modules, generatedAt } = data;
	const formateurName = fullName(formateur.firstName, formateur.lastName);

	const totalHonoraires =
		mission.tjm !== null && mission.numberOfDays !== null
			? mission.tjm * mission.numberOfDays
			: null;
	const totalFrais = (mission.deplacementCost ?? 0) + (mission.hebergementCost ?? 0);
	const totalMission = (totalHonoraires ?? 0) + totalFrais;

	const financialRows: Content[][] = [];
	if (mission.tjm !== null) {
		financialRows.push([
			{ text: 'Taux journalier (TJM) HT', style: 'label' },
			{ text: `${formatPdfCurrency(mission.tjm)}`, style: 'value', alignment: 'right' as const }
		]);
	}
	if (mission.numberOfDays !== null) {
		financialRows.push([
			{ text: 'Nombre de jours', style: 'label' },
			{ text: `${mission.numberOfDays}`, style: 'value', alignment: 'right' as const }
		]);
	}
	if (totalHonoraires !== null) {
		financialRows.push([
			{ text: 'Total honoraires HT', style: 'label', bold: true },
			{ text: `${formatPdfCurrency(totalHonoraires)}`, style: 'value', bold: true, alignment: 'right' as const }
		]);
	}
	if (mission.deplacementCost !== null && mission.deplacementCost > 0) {
		financialRows.push([
			{ text: 'Frais de déplacement', style: 'label' },
			{ text: `${formatPdfCurrency(mission.deplacementCost)}`, style: 'value', alignment: 'right' as const }
		]);
	}
	if (mission.hebergementCost !== null && mission.hebergementCost > 0) {
		financialRows.push([
			{ text: 'Frais d\'hébergement', style: 'label' },
			{ text: `${formatPdfCurrency(mission.hebergementCost)}`, style: 'value', alignment: 'right' as const }
		]);
	}
	if (totalFrais > 0 || totalHonoraires !== null) {
		financialRows.push([
			{ text: 'Total mission HT', style: 'label', bold: true },
			{ text: `${formatPdfCurrency(totalMission)}`, style: 'value', bold: true, alignment: 'right' as const }
		]);
	}

	const content: Content[] = [
		buildOrgHeader(workspace),

		{
			text: 'ORDRE DE MISSION',
			style: 'header',
			alignment: 'center' as const,
			margin: [0, 0, 0, 5] as [number, number, number, number]
		},
		{
			text: `Émis le ${formatDateFr(generatedAt)}`,
			style: 'small',
			alignment: 'center' as const,
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},

		{ text: 'Formateur missionné', style: 'sectionTitle' },
		{
			text: [
				{ text: formateurName, bold: true },
				...(formateur.specialite ? [`, ${formateur.specialite}`] : [])
			],
			style: 'body',
			margin: [0, 0, 0, 15] as [number, number, number, number]
		},

		{ text: 'Mission', style: 'sectionTitle' },
		{
			text: [
				`L'organisme de formation `,
				{ text: workspace.legalName ?? workspace.name ?? '—', bold: true },
				` confie à ${formateurName} l'animation de l'action de formation suivante :`
			],
			style: 'body',
			margin: [0, 0, 0, 10] as [number, number, number, number]
		},

		{
			table: {
				widths: ['30%', '*'],
				body: [
					[{ text: 'Formation', style: 'label' }, { text: formation.name, style: 'value', bold: true }],
					[{ text: 'Dates', style: 'label' }, { text: `Du ${formatDateFr(formation.dateDebut)} au ${formatDateFr(formation.dateFin)}`, style: 'value' }],
					[{ text: 'Durée', style: 'label' }, { text: `${formation.duree ?? '—'} heures`, style: 'value' }],
					[{ text: 'Modalité', style: 'label' }, { text: formation.modalite ?? '—', style: 'value' }],
					[{ text: 'Lieu', style: 'label' }, { text: formation.location ?? 'À définir', style: 'value' }],
					...(formation.publicVise ? [[{ text: 'Public', style: 'label' }, { text: formation.publicVise, style: 'value' }]] : [])
				]
			},
			layout: 'lightHorizontalLines',
			margin: [0, 5, 0, 15] as [number, number, number, number]
		},

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

		...(financialRows.length > 0
			? [
				{ text: 'Conditions financières', style: 'sectionTitle' } as Content,
				{
					table: {
						widths: ['*', '30%'],
						body: financialRows
					},
					layout: 'lightHorizontalLines',
					margin: [0, 5, 0, 15] as [number, number, number, number]
				} as Content
			]
			: []),

		{ text: 'Obligations du formateur', style: 'sectionTitle' },
		{
			ul: [
				'Respecter le programme pédagogique défini',
				'Assurer le suivi des feuilles d\'émargement (signature numérique ou physique)',
				'Remettre un bilan pédagogique à l\'issue de la formation',
				'Signaler toute difficulté ou incident à l\'organisme de formation'
			],
			style: 'body',
			margin: [0, 5, 0, 15] as [number, number, number, number]
		},

		{
			text: `\nFait à ${workspace.city ?? '________'}, le ${formatDateFr(generatedAt)}`,
			style: 'body',
			margin: [0, 10, 0, 0] as [number, number, number, number]
		},

		buildSignatureBlock(workspace, formateurName),
		buildReferralFooter(workspace.showReferralCta)
	];

	return {
		content,
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Ordre de mission - ${formateurName} - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
