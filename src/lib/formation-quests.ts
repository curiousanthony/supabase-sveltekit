import type { InferSelectModel } from 'drizzle-orm';
import type { formationActions } from '$lib/db/schema';

export type QuestPhase = 'conception' | 'deploiement' | 'evaluation';

export interface SubActionTemplate {
	title: string;
	description?: string;
}

export interface QuestTemplate {
	key: string;
	phase: QuestPhase;
	title: string;
	description: string;
	guidance: string;
	subActions: SubActionTemplate[];
	dependencies: string[];
	applicableTo: {
		types?: ('Intra' | 'Inter' | 'CPF')[];
		funding?: ('CPF' | 'OPCO' | 'Inter' | 'Intra')[];
	} | null;
	dueDateOffset: {
		days: number;
		reference: 'dateDebut' | 'dateFin';
	} | null;
	criticalForQualiopi: boolean;
	orderIndex: number;
}

export const PHASE_LABELS: Record<QuestPhase, string> = {
	conception: 'Conception',
	deploiement: 'Déploiement',
	evaluation: 'Évaluation'
};

export const QUEST_TEMPLATES: QuestTemplate[] = [
	// ── CONCEPTION (9 quests) ────────────────────────────────────────────
	{
		key: 'verification_infos',
		phase: 'conception',
		title: 'Vérification des informations',
		description: 'Vérifier que toutes les informations de la formation sont complètes et correctes.',
		guidance:
			"Passez en revue chaque champ de la fiche formation : intitulé, durée, dates, modalité, client. C'est la base du dossier Qualiopi.",
		subActions: [
			{ title: 'Vérifier l\'intitulé et la description' },
			{ title: 'Confirmer les dates de début et de fin' },
			{ title: 'Vérifier la modalité et la durée' },
			{ title: 'Confirmer les informations client' }
		],
		dependencies: [],
		applicableTo: null,
		dueDateOffset: { days: -30, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 0
	},
	{
		key: 'analyse_besoins',
		phase: 'conception',
		title: 'Analyse des besoins',
		description: "Recueillir et analyser les besoins de formation des apprenants et du donneur d'ordre.",
		guidance:
			"Envoyez un questionnaire d'analyse des besoins aux apprenants et/ou à leur manager. Les réponses permettront d'adapter le programme. Indicateur Qualiopi n°4.",
		subActions: [
			{ title: 'Choisir ou créer le questionnaire de besoins' },
			{ title: 'Envoyer aux apprenants' },
			{ title: 'Collecter les réponses' },
			{ title: 'Partager les résultats avec le formateur' }
		],
		dependencies: ['verification_infos'],
		applicableTo: null,
		dueDateOffset: { days: -21, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 1
	},
	{
		key: 'programme_modules',
		phase: 'conception',
		title: 'Programme et modules',
		description: "Confirmer le programme de formation, les modules et les objectifs pédagogiques.",
		guidance:
			"Associez un programme depuis la bibliothèque ou créez-en un sur mesure. Vérifiez les objectifs pédagogiques et les modalités d'évaluation. Indicateurs Qualiopi n°5 et n°6.",
		subActions: [
			{ title: 'Associer ou créer le programme' },
			{ title: 'Vérifier les modules et leur durée' },
			{ title: 'Confirmer les objectifs pédagogiques' },
			{ title: "Valider les modalités d'évaluation" }
		],
		dependencies: ['verification_infos'],
		applicableTo: null,
		dueDateOffset: { days: -21, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 2
	},
	{
		key: 'convention',
		phase: 'conception',
		title: 'Convention de formation',
		description: "Générer, envoyer et faire signer la convention de formation au client.",
		guidance:
			"La convention formalise l'accord entre l'organisme et le client. Elle doit être signée avant le début de la formation.",
		subActions: [
			{ title: 'Générer la convention' },
			{ title: 'Relire et personnaliser si nécessaire' },
			{ title: 'Envoyer au client' },
			{ title: 'Obtenir la signature' }
		],
		dependencies: ['programme_modules'],
		applicableTo: null,
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 3
	},
	{
		key: 'demande_financement',
		phase: 'conception',
		title: 'Demande de financement',
		description: "Déposer et suivre la demande de prise en charge auprès de l'OPCO ou sur Mon Compte Formation.",
		guidance:
			"La demande OPCO doit être déposée au moins 15 jours avant J0. Pour le CPF, créez la session sur EDOF et attendez la validation (11 jours de délai légal).",
		subActions: [
			{ title: 'Préparer le dossier de financement' },
			{ title: "Déposer sur la plateforme (OPCO ou EDOF)" },
			{ title: "Suivre l'état de la demande" }
		],
		dependencies: ['convention'],
		applicableTo: { funding: ['OPCO', 'CPF'] },
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 4
	},
	{
		key: 'convocations',
		phase: 'conception',
		title: 'Convocations',
		description: "Générer et envoyer les convocations aux apprenants avec le livret d'accueil.",
		guidance:
			"Chaque apprenant doit recevoir une convocation officielle contenant les informations pratiques (lieu, date, horaires) ainsi que le livret d'accueil.",
		subActions: [
			{ title: 'Générer les convocations' },
			{ title: "Joindre le livret d'accueil" },
			{ title: 'Envoyer à tous les apprenants' }
		],
		dependencies: ['convention'],
		applicableTo: null,
		dueDateOffset: { days: -10, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 5
	},
	{
		key: 'test_positionnement',
		phase: 'conception',
		title: 'Test de positionnement',
		description: "Évaluer le niveau initial des apprenants avant la formation.",
		guidance:
			"Le test de positionnement permet d'adapter le contenu aux besoins réels. Il sera comparé au test final pour mesurer la progression. Indicateur Qualiopi n°8.",
		subActions: [
			{ title: 'Choisir ou créer le test de positionnement' },
			{ title: "Configurer l'envoi" },
			{ title: 'Envoyer aux apprenants' },
			{ title: 'Collecter les résultats' }
		],
		dependencies: ['analyse_besoins'],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 6
	},
	{
		key: 'ordre_mission',
		phase: 'conception',
		title: 'Ordre de mission formateur',
		description: "Générer et envoyer l'ordre de mission au formateur.",
		guidance:
			"L'ordre de mission détaille les conditions d'intervention : dates, lieu, contenu, rémunération. Le formateur doit le retourner signé.",
		subActions: [
			{ title: "Générer l'ordre de mission" },
			{ title: 'Envoyer au formateur' },
			{ title: 'Collecter la copie signée' }
		],
		dependencies: ['convention'],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 7
	},
	{
		key: 'documents_formateur',
		phase: 'conception',
		title: 'Documents formateur',
		description: "S'assurer que tous les documents administratifs du formateur sont à jour.",
		guidance:
			"Vérifiez que le formateur a fourni : CV à jour, diplômes, attestation URSSAF, SIRET, NDA. Relancez si des documents manquent. Indicateur Qualiopi n°21.",
		subActions: [
			{ title: 'Vérifier le CV à jour' },
			{ title: 'Vérifier les diplômes' },
			{ title: 'Vérifier NDA / URSSAF / SIRET' },
			{ title: 'Relancer pour les documents manquants' }
		],
		dependencies: [],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 8
	},

	// ── DEPLOIEMENT (4 quests) ──────────────────────────────────────────
	{
		key: 'accueil_lancement',
		phase: 'deploiement',
		title: 'Accueil et lancement',
		description: "Accueillir les apprenants et lancer la formation.",
		guidance:
			"Vérifiez que la logistique est prête (salle, matériel, accès distanciel). Accueillez les apprenants et distribuez les supports si nécessaire.",
		subActions: [
			{ title: 'Vérifier la logistique (salle, matériel, lien visio)' },
			{ title: 'Accueillir les apprenants' },
			{ title: 'Distribuer les supports de formation' }
		],
		dependencies: [
			'verification_infos',
			'programme_modules',
			'convention',
			'convocations',
			'documents_formateur'
		],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 9
	},
	{
		key: 'emargement',
		phase: 'deploiement',
		title: 'Suivi des émargements',
		description: "S'assurer que les feuilles de présence sont signées par tous les participants à chaque séance.",
		guidance:
			"L'émargement est obligatoire pour Qualiopi. Vérifiez quotidiennement que tous les apprenants ont signé. Relancez en cas de signatures manquantes. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Vérifier les signatures quotidiennes' },
			{ title: 'Relancer les signatures manquantes' },
			{ title: 'Envoyer des rappels si nécessaire' }
		],
		dependencies: ['accueil_lancement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 10
	},
	{
		key: 'evaluations_formatives',
		phase: 'deploiement',
		title: 'Évaluations formatives',
		description: "Réaliser des évaluations en cours de formation pour mesurer la progression.",
		guidance:
			"Des évaluations en cours de formation (quiz, exercices pratiques, mises en situation) permettent de vérifier l'acquisition des compétences et d'adapter le contenu. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Réaliser les évaluations prévues' },
			{ title: 'Consigner les résultats' },
			{ title: 'Adapter le contenu si nécessaire' }
		],
		dependencies: ['accueil_lancement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 11
	},
	{
		key: 'suivi_absences',
		phase: 'deploiement',
		title: 'Suivi des absences',
		description: "Suivre et documenter les absences des apprenants.",
		guidance:
			"Enregistrez toute absence, informez le client si nécessaire, et documentez les justificatifs. Les absences impactent le certificat de réalisation.",
		subActions: [
			{ title: 'Enregistrer les absences' },
			{ title: 'Informer le client si nécessaire' },
			{ title: 'Documenter les justificatifs' }
		],
		dependencies: ['accueil_lancement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 12
	},

	// ── EVALUATION (9 quests) ───────────────────────────────────────────
	{
		key: 'satisfaction_chaud',
		phase: 'evaluation',
		title: 'Questionnaire de satisfaction à chaud',
		description: "Recueillir la satisfaction immédiate des apprenants et du donneur d'ordre.",
		guidance:
			"Envoyez le questionnaire de satisfaction le jour de la fin de la formation ou le lendemain. Prévoyez des relances à J+2 et J+5. Indicateur Qualiopi n°30.",
		subActions: [
			{ title: 'Choisir ou créer le questionnaire apprenants' },
			{ title: 'Envoyer aux apprenants' },
			{ title: "Envoyer au donneur d'ordre (client)" },
			{ title: 'Collecter et analyser les réponses' }
		],
		dependencies: ['emargement'],
		applicableTo: null,
		dueDateOffset: { days: 1, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 13
	},
	{
		key: 'evaluation_finale',
		phase: 'evaluation',
		title: 'Évaluation finale',
		description: "Évaluer les acquis de fin de formation et mesurer la progression.",
		guidance:
			"Administrez le test final (même format que le positionnement). Comparez les résultats pour mesurer la montée en compétences. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Administrer le test final' },
			{ title: 'Consigner les résultats' },
			{ title: 'Comparer avec le test de positionnement' }
		],
		dependencies: ['evaluations_formatives'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 14
	},
	{
		key: 'certificat_realisation',
		phase: 'evaluation',
		title: 'Certificat de réalisation',
		description: "Générer et envoyer le certificat de réalisation à chaque apprenant.",
		guidance:
			"Le certificat de réalisation atteste de la participation effective. Il doit mentionner la durée, les dates, et le nombre d'heures réalisées. Obligatoire pour les financements OPCO/CPF.",
		subActions: [
			{ title: 'Vérifier les données de présence' },
			{ title: 'Générer les certificats' },
			{ title: 'Envoyer aux apprenants' }
		],
		dependencies: ['emargement'],
		applicableTo: null,
		dueDateOffset: { days: 5, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 15
	},
	{
		key: 'attestation',
		phase: 'evaluation',
		title: 'Attestation de fin de formation',
		description: "Délivrer l'attestation de fin de formation individuelle.",
		guidance:
			"L'attestation mentionne les objectifs, la nature et la durée de l'action, ainsi que les résultats de l'évaluation des acquis.",
		subActions: [
			{ title: 'Générer les attestations' },
			{ title: 'Envoyer aux apprenants' },
			{ title: 'Archiver les copies' }
		],
		dependencies: ['certificat_realisation'],
		applicableTo: null,
		dueDateOffset: { days: 7, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 16
	},
	{
		key: 'facturation',
		phase: 'evaluation',
		title: 'Facturation',
		description: "Émettre et envoyer la facture au client ou à l'OPCO.",
		guidance:
			"Générez la facture avec les informations de la convention. Pour les financements OPCO, la facture peut être adressée directement à l'OPCO (subrogation) ou au client.",
		subActions: [
			{ title: 'Générer la facture' },
			{ title: "Envoyer au client ou à l'OPCO" },
			{ title: 'Suivre le paiement' }
		],
		dependencies: ['certificat_realisation'],
		applicableTo: null,
		dueDateOffset: { days: 10, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 17
	},
	{
		key: 'justificatifs_opco',
		phase: 'evaluation',
		title: 'Justificatifs OPCO',
		description: "Compiler et envoyer les pièces justificatives à l'OPCO pour obtenir le remboursement.",
		guidance:
			"Envoyez à l'OPCO : convention signée, feuilles d'émargement, certificat de réalisation, facture. Suivez le traitement du dossier.",
		subActions: [
			{ title: 'Compiler le dossier justificatif' },
			{ title: "Envoyer à l'OPCO" },
			{ title: 'Suivre la validation' }
		],
		dependencies: ['facturation'],
		applicableTo: { funding: ['OPCO'] },
		dueDateOffset: { days: 15, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 18
	},
	{
		key: 'satisfaction_froid',
		phase: 'evaluation',
		title: 'Satisfaction à froid (J+60)',
		description: "Évaluer l'impact de la formation 60 jours après sa fin.",
		guidance:
			"Le questionnaire à froid mesure le transfert des acquis en situation de travail. Programmez-le 60 jours après la fin de la formation. Indicateur Qualiopi n°32.",
		subActions: [
			{ title: "Programmer l'envoi à J+60" },
			{ title: 'Envoyer aux apprenants' },
			{ title: 'Collecter et analyser les réponses' }
		],
		dependencies: ['satisfaction_chaud'],
		applicableTo: null,
		dueDateOffset: { days: 60, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 19
	},
	{
		key: 'bilan_formateur',
		phase: 'evaluation',
		title: 'Bilan formateur',
		description: "Recueillir le retour du formateur sur le déroulement de la formation.",
		guidance:
			"Le bilan formateur permet d'identifier les points d'amélioration : rythme, contenu, groupe, logistique. Indicateur Qualiopi n°31.",
		subActions: [
			{ title: 'Envoyer le questionnaire de bilan' },
			{ title: 'Collecter le retour du formateur' },
			{ title: "Noter les points d'amélioration" }
		],
		dependencies: ['satisfaction_chaud'],
		applicableTo: null,
		dueDateOffset: { days: 7, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 20
	},
	{
		key: 'cloture_archivage',
		phase: 'evaluation',
		title: 'Clôture et archivage',
		description: "Vérifier la complétude du dossier et archiver l'ensemble des documents.",
		guidance:
			"Passez en revue tous les documents du dossier. Archivez-les pour une durée minimale de 5 ans (exigence Qualiopi). Marquez la formation comme terminée.",
		subActions: [
			{ title: 'Vérifier la présence de tous les documents' },
			{ title: 'Archiver le dossier complet' },
			{ title: 'Marquer la formation comme terminée' }
		],
		dependencies: [
			'satisfaction_chaud',
			'evaluation_finale',
			'certificat_realisation',
			'attestation',
			'facturation',
			'bilan_formateur'
		],
		applicableTo: null,
		dueDateOffset: { days: 90, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 21
	}
];

// ── Helpers ─────────────────────────────────────────────────────────────

type FormationType = 'Intra' | 'Inter' | 'CPF';
type FundingType = 'CPF' | 'OPCO' | 'Inter' | 'Intra';

export function getQuestsForFormation(
	type: FormationType | null | undefined,
	funding: FundingType | null | undefined
): QuestTemplate[] {
	return QUEST_TEMPLATES.filter((q) => {
		if (!q.applicableTo) return true;
		const { types, funding: fundingFilter } = q.applicableTo;
		if (types && type && !types.includes(type)) return false;
		if (fundingFilter && funding && !fundingFilter.includes(funding)) return false;
		if (fundingFilter && !funding) return false;
		return true;
	});
}

export function calculateDueDates(
	quests: QuestTemplate[],
	dateDebut: string | null | undefined,
	dateFin: string | null | undefined
): Map<string, string> {
	const dueDates = new Map<string, string>();
	for (const q of quests) {
		if (!q.dueDateOffset) continue;
		const refDate = q.dueDateOffset.reference === 'dateDebut' ? dateDebut : dateFin;
		if (!refDate) continue;
		const d = new Date(refDate);
		d.setDate(d.getDate() + q.dueDateOffset.days);
		dueDates.set(q.key, d.toISOString().slice(0, 10));
	}
	return dueDates;
}

type ActionRow = Pick<
	InferSelectModel<typeof formationActions>,
	'status' | 'questKey' | 'phase'
> & {
	subActions?: { completed: boolean }[];
};

export function getQuestProgress(actions: ActionRow[]) {
	const phases: Record<QuestPhase, { completed: number; total: number }> = {
		conception: { completed: 0, total: 0 },
		deploiement: { completed: 0, total: 0 },
		evaluation: { completed: 0, total: 0 }
	};

	let totalCompleted = 0;
	let totalCount = 0;

	for (const a of actions) {
		const phase = a.phase ?? 'conception';
		phases[phase].total++;
		totalCount++;
		if (a.status === 'Terminé') {
			phases[phase].completed++;
			totalCompleted++;
		}
	}

	return {
		phases,
		overall: {
			completed: totalCompleted,
			total: totalCount,
			percent: totalCount > 0 ? Math.round((totalCompleted / totalCount) * 100) : 0
		}
	};
}

export function getNextQuest(
	actions: ActionRow[]
): ActionRow | undefined {
	const inProgress = actions.find((a) => a.status === 'En cours');
	if (inProgress) return inProgress;
	return actions.find((a) => a.status === 'Pas commencé');
}

type StatusFormation =
	| 'À traiter'
	| 'Signature convention'
	| 'Financement'
	| 'Planification'
	| 'En cours'
	| 'Terminée'
	| 'Archivée';

export function shouldAutoAdvanceStatus(
	actions: ActionRow[],
	currentStatus: StatusFormation,
	hasFunding: boolean
): StatusFormation | null {
	const isComplete = (key: string) =>
		actions.some((a) => a.questKey === key && a.status === 'Terminé');

	const allPhaseComplete = (phase: QuestPhase) => {
		const phaseActions = actions.filter((a) => a.phase === phase);
		return phaseActions.length > 0 && phaseActions.every((a) => a.status === 'Terminé');
	};

	if (
		currentStatus === 'À traiter' &&
		isComplete('verification_infos') &&
		isComplete('programme_modules')
	) {
		return 'Signature convention';
	}

	if (currentStatus === 'Signature convention' && isComplete('convention')) {
		return hasFunding ? 'Financement' : 'Planification';
	}

	if (currentStatus === 'Financement' && isComplete('demande_financement')) {
		return 'Planification';
	}

	if (
		currentStatus === 'Planification' &&
		isComplete('convocations') &&
		isComplete('ordre_mission')
	) {
		return 'En cours';
	}

	if (currentStatus === 'En cours' && allPhaseComplete('evaluation')) {
		return 'Terminée';
	}

	if (currentStatus === 'Terminée' && isComplete('cloture_archivage')) {
		return 'Archivée';
	}

	return null;
}

export function getQuestTemplate(key: string): QuestTemplate | undefined {
	return QUEST_TEMPLATES.find((q) => q.key === key);
}

export function getPhaseQuests(phase: QuestPhase): QuestTemplate[] {
	return QUEST_TEMPLATES.filter((q) => q.phase === phase);
}
