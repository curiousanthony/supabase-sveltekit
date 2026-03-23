import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	type LearnerData,
	SHARED_STYLES,
	formatDateFr,
	fullName,
	buildOrgHeader,
	buildReferralFooter
} from './shared';

export interface ConvocationData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	learner: LearnerData;
	seances: { date: string; startTime: string; endTime: string; location: string | null }[];
}

export function buildConvocation(data: ConvocationData): TDocumentDefinitions {
	const { workspace, formation, learner, seances } = data;
	const learnerName = fullName(learner.firstName, learner.lastName);

	return {
		content: [
			buildOrgHeader(workspace),

			{
				text: 'CONVOCATION À UNE ACTION DE FORMATION',
				style: 'header',
				alignment: 'center' as const,
				margin: [0, 0, 0, 20] as [number, number, number, number]
			},

			{
				text: [
					{ text: 'Destinataire : ', style: 'label' },
					{ text: learnerName, style: 'value', bold: true }
				],
				margin: [0, 0, 0, 5] as [number, number, number, number]
			},
			...(learner.email
				? [
						{
							text: [{ text: 'Email : ', style: 'label' }, { text: learner.email, style: 'value' }],
							margin: [0, 0, 0, 15] as [number, number, number, number]
						}
					]
				: []),

			{
				text: `${workspace.city ?? '________'}, le ${formatDateFr(new Date().toISOString())}`,
				style: 'body',
				alignment: 'right' as const,
				margin: [0, 0, 0, 20] as [number, number, number, number]
			},

			{
				text: `Madame, Monsieur,\n\nNous avons le plaisir de vous confirmer votre inscription à la formation suivante :`,
				style: 'body',
				margin: [0, 0, 0, 15] as [number, number, number, number]
			},

			{
				table: {
					widths: ['30%', '*'],
					body: [
						[{ text: 'Formation', style: 'label' }, { text: formation.name, style: 'value', bold: true }],
						[{ text: 'Dates', style: 'label' }, { text: `Du ${formatDateFr(formation.dateDebut)} au ${formatDateFr(formation.dateFin)}`, style: 'value' }],
						[{ text: 'Durée', style: 'label' }, { text: `${formation.duree ?? '—'} heures`, style: 'value' }],
						[{ text: 'Modalité', style: 'label' }, { text: formation.modalite ?? '—', style: 'value' }],
						[{ text: 'Lieu', style: 'label' }, { text: formation.location ?? 'À confirmer', style: 'value' }]
					]
				},
				layout: 'lightHorizontalLines',
				margin: [0, 0, 0, 15] as [number, number, number, number]
			},

			...(seances.length > 0
				? [
						{ text: 'Planning des séances', style: 'subheader' },
						{
							table: {
								widths: ['25%', '20%', '20%', '*'],
								body: [
									[
										{ text: 'Date', style: 'label' },
										{ text: 'Début', style: 'label' },
										{ text: 'Fin', style: 'label' },
										{ text: 'Lieu', style: 'label' }
									],
									...seances.map((s) => [
										{ text: formatDateFr(s.date), style: 'body' },
										{ text: s.startTime, style: 'body' },
										{ text: s.endTime, style: 'body' },
										{ text: s.location ?? formation.location ?? '—', style: 'body' }
									])
								]
							},
							layout: 'lightHorizontalLines',
							margin: [0, 5, 0, 15] as [number, number, number, number]
						}
					]
				: []),

			...(formation.prerequis
				? [{ text: 'Prérequis', style: 'subheader' }, { text: formation.prerequis, style: 'body' }]
				: []),

			{ text: 'Documents à apporter', style: 'subheader' },
			{
				ul: ['Une pièce d\'identité en cours de validité', 'De quoi prendre des notes'],
				style: 'body',
				margin: [0, 5, 0, 15] as [number, number, number, number]
			},

			{
				text: `Pour toute question, n'hésitez pas à nous contacter${workspace.phone ? ` au ${workspace.phone}` : ''}${workspace.email ? ` ou par email à ${workspace.email}` : ''}.`,
				style: 'body',
				margin: [0, 10, 0, 10] as [number, number, number, number]
			},

			{
				text: `Cordialement,\n\n${workspace.signatoryName ?? ''}\n${workspace.signatoryRole ?? ''}`,
				style: 'body',
				margin: [0, 10, 0, 0] as [number, number, number, number]
			},

			buildReferralFooter(workspace.showReferralCta)
		],
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Convocation - ${learnerName} - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
