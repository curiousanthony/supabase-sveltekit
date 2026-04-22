import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	type LearnerData,
	SHARED_STYLES,
	formatDateFr,
	fullName,
	buildOrgHeader,
	buildSignatureBlock,
	buildReferralFooter
} from './shared';

export interface CertificatData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	learner: LearnerData;
	attendance: {
		totalHours: number;
		attendedHours: number;
	};
}

export function buildCertificat(data: CertificatData): TDocumentDefinitions {
	const { workspace, formation, learner, attendance } = data;
	const learnerName = fullName(learner.firstName, learner.lastName);

	return {
		content: [
			buildOrgHeader(workspace),

			{
				text: 'CERTIFICAT DE RÉALISATION',
				style: 'header',
				alignment: 'center' as const,
				margin: [0, 20, 0, 5] as [number, number, number, number]
			},
			{
				text: 'Article R.6332-26 du Code du travail',
				style: 'small',
				alignment: 'center' as const,
				margin: [0, 0, 0, 30] as [number, number, number, number]
			},

			{
				text: [
					`Je soussigné(e), `,
					{ text: workspace.signatoryName ?? '________', bold: true },
					`, en qualité de ${workspace.signatoryRole ?? 'Responsable'}`,
					` de l'organisme de formation `,
					{ text: workspace.legalName ?? workspace.name ?? '________', bold: true },
					workspace.nda ? `, enregistré sous le numéro de déclaration d'activité ${workspace.nda}` : '',
					`, atteste que :`
				],
				style: 'body',
				margin: [0, 0, 0, 20] as [number, number, number, number]
			},

			{
				table: {
					widths: ['35%', '*'],
					body: [
						[
							{ text: 'Stagiaire', style: 'label' },
							{ text: learnerName, style: 'value', bold: true }
						],
						[
							{ text: 'Action de formation', style: 'label' },
							{ text: formation.name, style: 'value', bold: true }
						],
						[
							{ text: 'Nature de l\'action', style: 'label' },
							{ text: 'Action de formation (au sens de l\'article L.6313-1 du Code du travail)', style: 'value' }
						],
						[
							{ text: 'Modalité', style: 'label' },
							{ text: formation.modalite ?? '—', style: 'value' }
						],
						[
							{ text: 'Dates de réalisation', style: 'label' },
							{ text: `Du ${formatDateFr(formation.dateDebut)} au ${formatDateFr(formation.dateFin)}`, style: 'value' }
						],
						[
							{ text: 'Durée prévue', style: 'label' },
							{ text: `${attendance.totalHours} heures`, style: 'value' }
						],
						[
							{ text: 'Durée effective', style: 'label' },
							{ text: `${attendance.attendedHours} heures`, style: 'value' }
						]
					]
				},
				layout: 'lightHorizontalLines',
				margin: [0, 0, 0, 20] as [number, number, number, number]
			},

			{
				text: `a bien suivi l'action de formation mentionnée ci-dessus pour une durée effective de ${attendance.attendedHours} heure${attendance.attendedHours > 1 ? 's' : ''}.`,
				style: 'body',
				margin: [0, 0, 0, 10] as [number, number, number, number]
			},

			...(attendance.attendedHours < attendance.totalHours
				? [
						{
							text: `Note : La durée effective de formation (${attendance.attendedHours}h) est inférieure à la durée prévue (${attendance.totalHours}h).`,
							style: 'body',
							color: '#cc0000',
							margin: [0, 0, 0, 10] as [number, number, number, number]
						}
					]
				: []),

			{
				text: `\nFait pour servir et valoir ce que de droit.\n\nÀ ${workspace.city ?? '________'}, le ${formatDateFr(new Date().toISOString())}`,
				style: 'body',
				margin: [0, 10, 0, 0] as [number, number, number, number]
			},

			buildSignatureBlock(workspace),
			buildReferralFooter(workspace.showReferralCta)
		],
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Certificat de réalisation - ${learnerName} - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
