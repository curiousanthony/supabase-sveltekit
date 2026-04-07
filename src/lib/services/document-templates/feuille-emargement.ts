import type { TDocumentDefinitions, Content } from 'pdfmake/interfaces';
import {
	type WorkspaceIdentity,
	type FormationData,
	SHARED_STYLES,
	formatDateFr,
	buildOrgHeader,
	buildReferralFooter
} from './shared';

export interface EmargementEntry {
	name: string;
	contactId: string | null;
	signerType: 'apprenant' | 'formateur';
	period: 'morning' | 'afternoon';
	signedAt: string | null;
}

export interface FeuilleEmargementData {
	workspace: WorkspaceIdentity;
	formation: FormationData;
	seance: {
		date: string;
		startAt: string;
		endAt: string;
		location: string | null;
	};
	formateurName: string | null;
	entries: EmargementEntry[];
}

function formatTimeFr(iso: string): string {
	return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function formatSignatureCell(signedAt: string | null): Content {
	if (signedAt) {
		return {
			text: `Signé le ${formatDateFr(signedAt)} à ${formatTimeFr(signedAt)}`,
			style: 'small',
			color: '#16a34a'
		};
	}
	return { text: 'Non signé', style: 'small', color: '#dc2626' };
}

export function buildFeuilleEmargement(data: FeuilleEmargementData): TDocumentDefinitions {
	const { workspace, formation, seance, formateurName, entries } = data;

	const morningEntries = entries.filter((e) => e.period === 'morning');
	const afternoonEntries = entries.filter((e) => e.period === 'afternoon');

	const apprenantMorning = morningEntries.filter((e) => e.signerType === 'apprenant');
	const apprenantAfternoon = afternoonEntries.filter((e) => e.signerType === 'apprenant');
	const formateurMorning = morningEntries.filter((e) => e.signerType === 'formateur');
	const formateurAfternoon = afternoonEntries.filter((e) => e.signerType === 'formateur');

	const seenIds = new Set<string>();
	const uniqueApprenants: { id: string; name: string }[] = [];
	for (const e of [...apprenantMorning, ...apprenantAfternoon]) {
		const key = e.contactId ?? e.name;
		if (!seenIds.has(key)) {
			seenIds.add(key);
			uniqueApprenants.push({ id: key, name: e.name });
		}
	}

	const tableBody: Content[][] = [
		[
			{ text: 'Nom', style: 'label', bold: true },
			{ text: 'Matin', style: 'label', bold: true, alignment: 'center' as const },
			{ text: 'Après-midi', style: 'label', bold: true, alignment: 'center' as const }
		]
	];

	for (const apprenant of uniqueApprenants) {
		const am = apprenantMorning.find((e) => (e.contactId ?? e.name) === apprenant.id);
		const pm = apprenantAfternoon.find((e) => (e.contactId ?? e.name) === apprenant.id);
		tableBody.push([
			{ text: apprenant.name, style: 'body' },
			formatSignatureCell(am?.signedAt ?? null),
			formatSignatureCell(pm?.signedAt ?? null)
		]);
	}

	const formateurRow: Content[] = [];
	if (formateurMorning.length > 0 || formateurAfternoon.length > 0) {
		const fmAm = formateurMorning[0];
		const fmPm = formateurAfternoon[0];
		formateurRow.push(
			{ text: `Formateur : ${formateurName ?? fmAm?.name ?? fmPm?.name ?? '—'}`, style: 'body', bold: true },
			formatSignatureCell(fmAm?.signedAt ?? null),
			formatSignatureCell(fmPm?.signedAt ?? null)
		);
	}

	const content: Content[] = [
		buildOrgHeader(workspace),

		{
			text: "FEUILLE D'ÉMARGEMENT",
			style: 'header',
			alignment: 'center' as const,
			margin: [0, 0, 0, 5] as [number, number, number, number]
		},
		{
			text: 'Preuve de présence — Signatures numériques',
			style: 'small',
			alignment: 'center' as const,
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},

		{
			table: {
				widths: ['30%', '*'],
				body: [
					[{ text: 'Formation', style: 'label' }, { text: formation.name, style: 'value', bold: true }],
					[{ text: 'Date de la séance', style: 'label' }, { text: formatDateFr(seance.date), style: 'value' }],
					[{ text: 'Horaires', style: 'label' }, { text: `${formatTimeFr(seance.startAt)} — ${formatTimeFr(seance.endAt)}`, style: 'value' }],
					[{ text: 'Lieu', style: 'label' }, { text: seance.location ?? formation.location ?? '—', style: 'value' }],
					[{ text: 'Formateur', style: 'label' }, { text: formateurName ?? '—', style: 'value' }],
					[{ text: 'Durée', style: 'label' }, { text: `${formation.duree ?? '—'} heures (total formation)`, style: 'value' }]
				]
			},
			layout: 'lightHorizontalLines',
			margin: [0, 0, 0, 20] as [number, number, number, number]
		},

		{ text: 'Émargements des stagiaires', style: 'subheader' },

		{
			table: {
				headerRows: 1,
				widths: ['40%', '30%', '30%'],
				body: tableBody
			},
			layout: 'lightHorizontalLines',
			margin: [0, 5, 0, 15] as [number, number, number, number]
		}
	];

	if (formateurRow.length > 0) {
		content.push(
			{ text: 'Émargement du formateur', style: 'subheader' },
			{
				table: {
					widths: ['40%', '30%', '30%'],
					body: [
						[
							{ text: 'Nom', style: 'label', bold: true },
							{ text: 'Matin', style: 'label', bold: true, alignment: 'center' as const },
							{ text: 'Après-midi', style: 'label', bold: true, alignment: 'center' as const }
						],
						formateurRow
					]
				},
				layout: 'lightHorizontalLines',
				margin: [0, 5, 0, 15] as [number, number, number, number]
			}
		);
	}

	content.push(
		{
			text: 'Les signatures numériques font foi. Ce document est un justificatif de présence archivé automatiquement.',
			style: 'small',
			margin: [0, 15, 0, 0] as [number, number, number, number]
		},
		buildReferralFooter(workspace.showReferralCta)
	);

	return {
		content,
		styles: SHARED_STYLES,
		defaultStyle: { font: 'Helvetica' },
		pageMargins: [40, 40, 40, 40],
		info: {
			title: `Feuille d'émargement - ${formatDateFr(seance.date)} - ${formation.name}`,
			author: workspace.legalName ?? workspace.name ?? 'Mentore Manager'
		}
	};
}
