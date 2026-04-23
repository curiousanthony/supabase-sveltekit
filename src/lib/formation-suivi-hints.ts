import { getQuestTemplate } from '$lib/formation-quests';

function fmtDayMonth(iso: string | null | undefined): string {
	if (!iso) return '';
	return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function fmtFull(iso: string | null | undefined): string {
	if (!iso) return '';
	return new Date(iso).toLocaleDateString('fr-FR', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

/** Short, contextual copy for 🔒 Verrouillé — avoids long “Cette étape sera disponible après…”. */
export function getHardLockTooltipText(
	questKey: string | null,
	firstHardDepKey: string | undefined,
	formation: { dateDebut?: string | null; dateFin?: string | null }
): string {
	const debut = formation.dateDebut ? fmtFull(formation.dateDebut) : null;
	const fin = formation.dateFin ? fmtFull(formation.dateFin) : null;

	const byQuest: Record<string, string> = {
		accueil_lancement: debut
			? `À partir du ${debut} — accueillir et lancer la session.`
			: 'Quand la formation démarre (logistique et convocations prêtes).',
		emargement:
			'Une fois la formation lancée : une signature par séance, dans l’onglet Séances.',
		animation_pedagogique: 'Dès que l’accueil et le lancement sont faits.',
		evaluations_formatives: 'Pendant la formation, après le lancement pédagogique.',
		suivi_absences: 'Les absences se suivent à partir des feuilles de présence.',
		adaptation_formation: 'Après les premières évaluations en cours de formation.',
		satisfaction_chaud: fin
			? `Juste après la fin de la formation (${fin}).`
			: 'Juste après la fin de la formation.',
		evaluation_acquis_fin: 'En fin de parcours, une fois les modules animés.',
		certificat_realisation: 'Après les présences complétées sur les séances.',
		attestation: 'Quand le certificat et le bilan des acquis sont prêts.',
		facturation: 'Après le certificat de réalisation.',
		justificatifs_opco: 'Après la facture et les pièces du dossier.',
		satisfaction_froid: 'Environ 60 jours après la fin — questionnaire à froid.',
		evaluation_transfert: 'Après le questionnaire à froid (J+60).',
		bilan_formateur: 'Une fois la satisfaction à chaud collectée.',
		amelioration_continue: 'Quand retours apprenants, formateur et à froid sont réunis.',
		cloture_archivage: 'Quand toutes les étapes d’évaluation sont bouclées.'
	};

	if (questKey && byQuest[questKey]) return byQuest[questKey];

	const dep = firstHardDepKey ? getQuestTemplate(firstHardDepKey) : null;
	const depTitle = dep?.title ?? 'l’étape précédente';
	return `Dès que « ${depTitle} » est terminée.`;
}

export function getPhaseDateRangeLine(
	phase: 'conception' | 'deploiement' | 'evaluation',
	formation: {
		createdAt?: string | null;
		dateDebut?: string | null;
		dateFin?: string | null;
	},
	evaluationPhaseEndIso: string | null
): string {
	const { createdAt, dateDebut, dateFin } = formation;

	if (phase === 'conception') {
		if (!dateDebut) return '';
		const start = createdAt ? fmtDayMonth(createdAt) : '';
		const endDate = new Date(dateDebut);
		endDate.setDate(endDate.getDate() - 1);
		const end = fmtDayMonth(endDate.toISOString().slice(0, 10));
		if (start && end) return `${start} → ${end}`;
		return `Jusqu’au ${fmtDayMonth(dateDebut)}`;
	}

	if (phase === 'deploiement') {
		if (dateDebut && dateFin) {
			const a = new Date(dateDebut);
			const b = new Date(dateFin);
			const sameMonth =
				a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
			if (sameMonth) {
				return `${a.getDate()}–${b.getDate()} ${a.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`;
			}
			return `${fmtDayMonth(dateDebut)} → ${fmtDayMonth(dateFin)}`;
		}
		if (dateDebut) return `À partir du ${fmtDayMonth(dateDebut)}`;
		return '';
	}

	// evaluation
	if (dateFin && evaluationPhaseEndIso) {
		const start = new Date(dateFin);
		start.setDate(start.getDate() + 1);
		return `${fmtDayMonth(start.toISOString().slice(0, 10))} → ${fmtDayMonth(evaluationPhaseEndIso)}`;
	}
	if (dateFin) {
		const start = new Date(dateFin);
		start.setDate(start.getDate() + 1);
		return `À partir du ${fmtDayMonth(start.toISOString().slice(0, 10))}`;
	}
	return '';
}

export function getPhaseCountdownLine(
	phase: 'conception' | 'deploiement' | 'evaluation',
	formation: { dateDebut?: string | null; dateFin?: string | null },
	p: { completed: number; total: number }
): string | null {
	const now = new Date();
	const dayMs = 1000 * 60 * 60 * 24;

	const daysUntil = (iso: string) =>
		Math.ceil((new Date(iso).getTime() - now.getTime()) / dayMs);

	if (phase === 'conception' && formation.dateDebut) {
		const d = daysUntil(formation.dateDebut);
		if (p.total > 0 && p.completed === p.total) return 'Phase terminée';
		if (d > 1) return `Formation dans ${d} jours`;
		if (d === 1) return 'Formation demain';
		if (d === 0) return 'La formation commence aujourd’hui';
		return 'Phase en cours';
	}

	if (phase === 'deploiement' && formation.dateFin && formation.dateDebut) {
		const start = new Date(formation.dateDebut).getTime();
		const end = new Date(formation.dateFin).getTime();
		const t = now.getTime();
		if (p.total > 0 && p.completed === p.total) return 'Phase terminée';
		if (t < start) {
			const d = Math.ceil((start - t) / dayMs);
			return d > 1 ? `Commence dans ${d} jours` : d === 1 ? 'Commence demain' : '';
		}
		if (t <= end) {
			const d = Math.ceil((end - t) / dayMs);
			if (d > 1) return `${d} jours restants`;
			if (d === 1) return 'Dernier jour demain';
			return 'Dernier jour';
		}
		return 'Phase terminée';
	}

	if (phase === 'evaluation' && formation.dateFin) {
		const evalStart = new Date(formation.dateFin);
		evalStart.setDate(evalStart.getDate() + 1);
		const d = daysUntil(evalStart.toISOString().slice(0, 10));
		if (p.total > 0 && p.completed === p.total) return 'Phase terminée';
		if (d > 1) return `Commence dans ${d} jours`;
		if (d === 1) return 'Commence demain';
		if (d === 0) return 'La phase évaluation démarre aujourd’hui';
		if (d < 0) return 'Suivi post-formation en cours';
	}

	return null;
}
