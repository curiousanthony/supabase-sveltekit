import type { InferSelectModel } from 'drizzle-orm';
import type { formationActions } from '$lib/db/schema';

export type QuestPhase = 'conception' | 'deploiement' | 'evaluation';

export interface SubActionTemplate {
	title: string;
	description?: string;
	ctaType?: 'navigate' | 'upload' | 'external' | null;
	ctaLabel?: string;
	ctaTarget?: string;
	documentRequired?: boolean;
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
			{
				title: "Vérifier l'intitulé et la description",
				ctaType: 'navigate',
				ctaLabel: 'Voir la fiche',
				ctaTarget: '/formations/[id]/fiche'
			},
			{
				title: 'Confirmer les dates de début et de fin',
				ctaType: 'navigate',
				ctaLabel: 'Voir la fiche',
				ctaTarget: '/formations/[id]/fiche'
			},
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
			{
				title: 'Envoyer aux apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			},
			{ title: 'Collecter les réponses' },
			{
				title: 'Partager les résultats avec le formateur',
				ctaType: 'navigate',
				ctaLabel: 'Voir les formateurs',
				ctaTarget: '/formations/[id]/formateurs'
			}
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
			{
				title: 'Associer ou créer le programme',
				ctaType: 'navigate',
				ctaLabel: 'Aller au programme',
				ctaTarget: '/formations/[id]/programme'
			},
			{
				title: 'Vérifier les modules et leur durée',
				ctaType: 'navigate',
				ctaLabel: 'Voir les modules',
				ctaTarget: '/formations/[id]/programme'
			},
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
		key: 'devis',
		phase: 'conception',
		title: 'Établissement du devis',
		description: "Rédiger et envoyer un devis détaillé au client avec les tarifs, durée et conditions.",
		guidance:
			"Le devis doit mentionner : intitulé, dates, durée, nombre de stagiaires, coût HT/TTC, conditions de paiement et d'annulation. Indicateur Qualiopi n°1.",
		subActions: [
			{ title: 'Rédiger le devis' },
			{ title: 'Envoyer au client' },
			{
				title: 'Obtenir la validation du devis',
				ctaType: 'upload',
				ctaLabel: 'Déposer le devis signé',
				documentRequired: true
			}
		],
		dependencies: ['programme_modules'],
		applicableTo: null,
		dueDateOffset: { days: -20, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 3
	},
	{
		key: 'convention',
		phase: 'conception',
		title: 'Convention de formation',
		description: "Générer, envoyer et faire signer la convention de formation au client.",
		guidance:
			"La convention formalise l'accord entre l'organisme et le client. Elle doit être signée avant le début de la formation. Indicateur Qualiopi n°6.",
		subActions: [
			{ title: 'Générer la convention' },
			{ title: 'Relire et personnaliser si nécessaire' },
			{ title: 'Envoyer au client' },
			{
				title: 'Obtenir la signature',
				ctaType: 'upload',
				ctaLabel: 'Déposer la convention signée',
				documentRequired: true
			}
		],
		dependencies: ['devis'],
		applicableTo: null,
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 4
	},
	{
		key: 'demande_financement',
		phase: 'conception',
		title: 'Demande de prise en charge OPCO',
		description: "Constituer et déposer le dossier de demande de prise en charge auprès de l'OPCO.",
		guidance:
			"La demande OPCO doit être déposée au moins 15 jours à 2 mois avant J0. Le dossier comprend : convention, programme, devis, formulaire OPCO, infos salariés.",
		subActions: [
			{ title: 'Préparer le dossier de financement' },
			{
				title: "Déposer sur la plateforme OPCO",
				ctaType: 'external',
				ctaLabel: 'Ouvrir la plateforme OPCO'
			},
			{ title: "Suivre l'état de la demande" }
		],
		dependencies: ['convention'],
		applicableTo: { funding: ['OPCO'] },
		dueDateOffset: { days: -30, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 5
	},
	{
		key: 'accord_opco',
		phase: 'conception',
		title: 'Accord de prise en charge OPCO',
		description: "Réceptionner et vérifier l'accord de prise en charge émis par l'OPCO.",
		guidance:
			"Vérifiez que le montant accordé correspond au devis. En cas de prise en charge partielle, informez le client du reste à charge.",
		subActions: [
			{ title: "Réceptionner l'accord de prise en charge" },
			{ title: 'Vérifier le montant accordé' },
			{
				title: "Archiver l'accord",
				ctaType: 'upload',
				ctaLabel: "Déposer l'accord OPCO",
				documentRequired: true
			}
		],
		dependencies: ['demande_financement'],
		applicableTo: { funding: ['OPCO'] },
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 6
	},
	{
		key: 'session_edof',
		phase: 'conception',
		title: 'Création de la session EDOF',
		description: "Créer ou ouvrir une session sur la plateforme EDOF (Mon Compte Formation) pour les formations CPF.",
		guidance:
			"Définissez : dates, lieu, modalités, nombre de places. Le stagiaire s'inscrit via son espace Mon Compte Formation. Validez la demande sous 2 jours ouvrés.",
		subActions: [
			{
				title: 'Créer la session sur EDOF',
				ctaType: 'external',
				ctaLabel: 'Ouvrir EDOF'
			},
			{ title: "Valider l'inscription du stagiaire" },
			{ title: 'Confirmer le financement' }
		],
		dependencies: ['convention'],
		applicableTo: { funding: ['CPF'] },
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 7
	},
	{
		key: 'convocations',
		phase: 'conception',
		title: 'Convocations',
		description: "Générer et envoyer les convocations aux apprenants avec les informations pratiques.",
		guidance:
			"Chaque apprenant doit recevoir une convocation contenant : lieu, date, horaires, programme, documents à apporter. Indicateur Qualiopi n°9.",
		subActions: [
			{ title: 'Générer les convocations' },
			{
				title: "Joindre le livret d'accueil",
				ctaType: 'upload',
				ctaLabel: "Déposer le livret d'accueil",
				documentRequired: true
			},
			{
				title: 'Envoyer à tous les apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			}
		],
		dependencies: ['convention'],
		applicableTo: null,
		dueDateOffset: { days: -10, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 8
	},
	{
		key: 'reglement_interieur',
		phase: 'conception',
		title: 'Transmission du règlement intérieur',
		description: "Transmettre le règlement intérieur de l'organisme aux stagiaires avant ou au début de la formation.",
		guidance:
			"Obligatoire pour les formations > 500h, fortement recommandé pour toutes. Couvre : hygiène, sécurité, discipline, sanctions. Indicateur Qualiopi n°9.",
		subActions: [
			{
				title: 'Préparer le règlement intérieur',
				ctaType: 'upload',
				ctaLabel: 'Déposer le règlement',
				documentRequired: true
			},
			{ title: 'Transmettre aux stagiaires' }
		],
		dependencies: ['convocations'],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 9
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
			{
				title: 'Envoyer aux apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			},
			{ title: 'Collecter les résultats' }
		],
		dependencies: ['analyse_besoins'],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 10
	},
	{
		key: 'preparation_logistique',
		phase: 'conception',
		title: 'Préparation logistique',
		description: "Préparer l'environnement de formation : salle, matériel, supports, accessibilité.",
		guidance:
			"Réservez la salle, vérifiez le matériel (vidéoprojecteur, PC, connexion), préparez les supports pédagogiques, vérifiez l'accessibilité PMR. Indicateur Qualiopi n°17.",
		subActions: [
			{ title: 'Réserver la salle / vérifier le lien visio' },
			{ title: 'Vérifier le matériel technique' },
			{ title: 'Préparer les supports pédagogiques' },
			{ title: "Vérifier l'accessibilité PMR" }
		],
		dependencies: ['convention'],
		applicableTo: null,
		dueDateOffset: { days: -5, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 11
	},
	{
		key: 'affectation_formateur',
		phase: 'conception',
		title: 'Affectation du formateur',
		description: "Désigner le formateur et vérifier l'adéquation de ses compétences avec le contenu.",
		guidance:
			"Vérifiez les qualifications du formateur (CV, diplômes, expérience). Si sous-traitant : contrat de prestation + déclaration obligatoire. Indicateurs Qualiopi n°17, 21, 27.",
		subActions: [
			{
				title: 'Affecter le formateur',
				ctaType: 'navigate',
				ctaLabel: 'Voir les formateurs',
				ctaTarget: '/formations/[id]/formateurs'
			},
			{
				title: 'Vérifier les qualifications',
				ctaType: 'upload',
				ctaLabel: 'Déposer le CV',
				documentRequired: true
			},
			{ title: 'Formaliser le contrat (si sous-traitant)' }
		],
		dependencies: ['programme_modules'],
		applicableTo: null,
		dueDateOffset: { days: -15, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 12
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
			{
				title: 'Collecter la copie signée',
				ctaType: 'upload',
				ctaLabel: "Déposer l'ordre signé",
				documentRequired: true
			}
		],
		dependencies: ['convention'],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 13
	},
	{
		key: 'documents_formateur',
		phase: 'conception',
		title: 'Documents formateur',
		description: "S'assurer que tous les documents administratifs du formateur sont à jour.",
		guidance:
			"Vérifiez que le formateur a fourni : CV à jour, diplômes, attestation URSSAF, SIRET, NDA. Relancez si des documents manquent. Indicateur Qualiopi n°21.",
		subActions: [
			{
				title: 'Vérifier le CV à jour',
				ctaType: 'upload',
				ctaLabel: 'Déposer le CV',
				documentRequired: true
			},
			{
				title: 'Vérifier les diplômes',
				ctaType: 'upload',
				ctaLabel: 'Déposer les diplômes',
				documentRequired: true
			},
			{
				title: 'Vérifier NDA / URSSAF / SIRET',
				ctaType: 'upload',
				ctaLabel: 'Déposer les justificatifs',
				documentRequired: true
			},
			{ title: 'Relancer pour les documents manquants' }
		],
		dependencies: [],
		applicableTo: null,
		dueDateOffset: { days: -7, reference: 'dateDebut' },
		criticalForQualiopi: true,
		orderIndex: 14
	},

	// ── DEPLOIEMENT (6 quests) ──────────────────────────────────────────
	{
		key: 'accueil_lancement',
		phase: 'deploiement',
		title: 'Accueil et lancement',
		description: "Accueillir les apprenants et lancer la formation.",
		guidance:
			"Vérifiez que la logistique est prête (salle, matériel, accès distanciel). Accueillez les apprenants, faites le tour de table et distribuez les supports. Indicateurs Qualiopi n°9, 10.",
		subActions: [
			{ title: 'Vérifier la logistique (salle, matériel, lien visio)' },
			{ title: 'Accueillir les apprenants et faire le tour de table' },
			{ title: 'Distribuer les supports et le livret d\'accueil' },
			{ title: 'Recueillir les attentes des participants' }
		],
		dependencies: [
			'verification_infos',
			'programme_modules',
			'convention',
			'convocations',
			'documents_formateur',
			'preparation_logistique'
		],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateDebut' },
		criticalForQualiopi: false,
		orderIndex: 15
	},
	{
		key: 'emargement',
		phase: 'deploiement',
		title: 'Suivi des émargements',
		description: "S'assurer que les feuilles de présence sont signées par tous les participants à chaque séance.",
		guidance:
			"L'émargement est obligatoire (art. R.6313-3). Vérifiez quotidiennement que tous les apprenants ont signé matin ET après-midi. Relancez en cas de signatures manquantes.",
		subActions: [
			{
				title: 'Vérifier les signatures quotidiennes',
				ctaType: 'navigate',
				ctaLabel: 'Voir les séances',
				ctaTarget: '/formations/[id]/seances'
			},
			{ title: 'Relancer les signatures manquantes' },
			{ title: 'Envoyer des rappels si nécessaire' }
		],
		dependencies: ['accueil_lancement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 16
	},
	{
		key: 'animation_pedagogique',
		phase: 'deploiement',
		title: 'Animation pédagogique',
		description: "Dérouler le contenu pédagogique conformément au programme et adapter le rythme au groupe.",
		guidance:
			"Suivez le déroulé pédagogique. Documentez tout écart significatif par rapport au programme prévu et justifiez les adaptations. Indicateurs Qualiopi n°6, 10, 19.",
		subActions: [
			{
				title: 'Vérifier le déroulement conforme au programme',
				ctaType: 'navigate',
				ctaLabel: 'Voir le programme',
				ctaTarget: '/formations/[id]/programme'
			},
			{ title: 'Documenter les adaptations éventuelles' },
			{ title: 'Distribuer les supports pédagogiques' }
		],
		dependencies: ['accueil_lancement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 17
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
			{
				title: 'Consigner les résultats',
				ctaType: 'upload',
				ctaLabel: 'Déposer les résultats',
				documentRequired: true
			},
			{ title: 'Adapter le contenu si nécessaire' }
		],
		dependencies: ['animation_pedagogique'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 18
	},
	{
		key: 'suivi_absences',
		phase: 'deploiement',
		title: 'Suivi des absences',
		description: "Suivre et documenter les absences des apprenants, relancer et prévenir les abandons.",
		guidance:
			"Enregistrez toute absence, informez le client et/ou le financeur si nécessaire. Documentez les justificatifs et les actions de relance. Indicateur Qualiopi n°12.",
		subActions: [
			{
				title: 'Enregistrer les absences',
				ctaType: 'navigate',
				ctaLabel: 'Voir les séances',
				ctaTarget: '/formations/[id]/seances'
			},
			{ title: 'Informer le client si nécessaire' },
			{
				title: 'Documenter les justificatifs',
				ctaType: 'upload',
				ctaLabel: 'Déposer les justificatifs',
				documentRequired: true
			}
		],
		dependencies: ['emargement'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 19
	},
	{
		key: 'adaptation_formation',
		phase: 'deploiement',
		title: 'Adaptation en cours de formation',
		description: "Ajuster le déroulement en fonction des retours et des résultats des évaluations.",
		guidance:
			"Adaptez le rythme, approfondissez des sujets, modifiez les exercices selon les besoins. Documentez ces adaptations et justifiez-les. Indicateur Qualiopi n°10.",
		subActions: [
			{ title: 'Analyser les résultats des évaluations formatives' },
			{ title: 'Adapter le contenu si nécessaire' },
			{
				title: 'Documenter les adaptations',
				ctaType: 'upload',
				ctaLabel: 'Déposer les notes d\'adaptation',
				documentRequired: true
			}
		],
		dependencies: ['evaluations_formatives'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 20
	},

	// ── EVALUATION (11 quests) ──────────────────────────────────────────
	{
		key: 'satisfaction_chaud',
		phase: 'evaluation',
		title: 'Satisfaction à chaud',
		description: "Recueillir la satisfaction immédiate des apprenants et du donneur d'ordre.",
		guidance:
			"Envoyez le questionnaire de satisfaction le jour de la fin de la formation ou le lendemain. Prévoyez des relances à J+2 et J+5. Indicateur Qualiopi n°30 (non-conformité majeure si absent).",
		subActions: [
			{ title: 'Choisir ou créer le questionnaire apprenants' },
			{
				title: 'Envoyer aux apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			},
			{ title: "Envoyer au donneur d'ordre (client)" },
			{ title: 'Collecter et analyser les réponses' }
		],
		dependencies: ['emargement'],
		applicableTo: null,
		dueDateOffset: { days: 1, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 21
	},
	{
		key: 'evaluation_acquis_fin',
		phase: 'evaluation',
		title: 'Évaluation des acquis en fin de formation',
		description: "Évaluer l'atteinte des objectifs pédagogiques par chaque stagiaire et comparer avec le positionnement initial.",
		guidance:
			"Administrez le test final (même format que le positionnement). Comparez les résultats pour mesurer la montée en compétences. Les résultats doivent être documentés individuellement. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Administrer le test final' },
			{
				title: 'Consigner les résultats individuels',
				ctaType: 'upload',
				ctaLabel: 'Déposer les résultats',
				documentRequired: true
			},
			{ title: 'Comparer avec le test de positionnement' }
		],
		dependencies: ['evaluations_formatives'],
		applicableTo: null,
		dueDateOffset: { days: 0, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 22
	},
	{
		key: 'certificat_realisation',
		phase: 'evaluation',
		title: 'Certificat de réalisation',
		description: "Générer et envoyer le certificat de réalisation à chaque apprenant.",
		guidance:
			"Le certificat atteste de la participation effective (art. R.6332-26). Il doit mentionner : identité, nature de l'action, dates, durée effective. Obligatoire pour les financements OPCO/CPF.",
		subActions: [
			{
				title: 'Vérifier les données de présence',
				ctaType: 'navigate',
				ctaLabel: 'Voir les séances',
				ctaTarget: '/formations/[id]/seances'
			},
			{ title: 'Générer les certificats' },
			{
				title: 'Envoyer aux apprenants et au financeur',
				ctaType: 'upload',
				ctaLabel: 'Déposer les certificats',
				documentRequired: true
			}
		],
		dependencies: ['emargement'],
		applicableTo: null,
		dueDateOffset: { days: 5, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 23
	},
	{
		key: 'attestation',
		phase: 'evaluation',
		title: 'Attestation de fin de formation',
		description: "Délivrer l'attestation de fin de formation individuelle mentionnant les acquis réels.",
		guidance:
			"L'attestation mentionne les objectifs, la nature et la durée de l'action, les compétences acquises et les résultats de l'évaluation. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Générer les attestations' },
			{
				title: 'Envoyer aux apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			},
			{
				title: 'Archiver les copies',
				ctaType: 'upload',
				ctaLabel: 'Déposer les attestations',
				documentRequired: true
			}
		],
		dependencies: ['certificat_realisation', 'evaluation_acquis_fin'],
		applicableTo: null,
		dueDateOffset: { days: 7, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 24
	},
	{
		key: 'facturation',
		phase: 'evaluation',
		title: 'Facturation',
		description: "Émettre et envoyer la facture au client ou à l'OPCO.",
		guidance:
			"Générez la facture avec les informations de la convention. Pour les financements OPCO en subrogation, adressez-la directement à l'OPCO. Pour le CPF, saisissez-la dans EDOF.",
		subActions: [
			{ title: 'Générer la facture' },
			{ title: "Envoyer au client ou à l'OPCO" },
			{
				title: 'Suivre le paiement',
				ctaType: 'navigate',
				ctaLabel: 'Voir les finances',
				ctaTarget: '/formations/[id]/finances'
			}
		],
		dependencies: ['certificat_realisation'],
		applicableTo: null,
		dueDateOffset: { days: 10, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 25
	},
	{
		key: 'justificatifs_opco',
		phase: 'evaluation',
		title: 'Justificatifs au financeur',
		description: "Compiler et envoyer les pièces justificatives à l'OPCO ou déclarer le service fait sur EDOF.",
		guidance:
			"OPCO : envoyez convention, émargements, certificat de réalisation, facture. CPF : déclarez le service fait sur EDOF. La CDC règle sous 30 jours.",
		subActions: [
			{
				title: 'Compiler le dossier justificatif',
				ctaType: 'upload',
				ctaLabel: 'Déposer les justificatifs',
				documentRequired: true
			},
			{ title: "Envoyer à l'OPCO / déclarer sur EDOF" },
			{ title: 'Suivre la validation' }
		],
		dependencies: ['facturation'],
		applicableTo: { funding: ['OPCO', 'CPF'] },
		dueDateOffset: { days: 15, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 26
	},
	{
		key: 'satisfaction_froid',
		phase: 'evaluation',
		title: 'Satisfaction à froid (J+60)',
		description: "Évaluer l'impact de la formation 1 à 3 mois après sa fin.",
		guidance:
			"Le questionnaire à froid mesure le transfert des acquis en situation de travail. Envoyez-le aussi au commanditaire (entreprise). Indicateur Qualiopi n°30.",
		subActions: [
			{ title: "Programmer l'envoi à J+60" },
			{
				title: 'Envoyer aux apprenants',
				ctaType: 'navigate',
				ctaLabel: 'Voir les apprenants',
				ctaTarget: '/formations/[id]/apprenants'
			},
			{ title: 'Envoyer au commanditaire (entreprise)' },
			{ title: 'Collecter et analyser les réponses' }
		],
		dependencies: ['satisfaction_chaud'],
		applicableTo: null,
		dueDateOffset: { days: 60, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 27
	},
	{
		key: 'evaluation_transfert',
		phase: 'evaluation',
		title: 'Évaluation des acquis à froid',
		description: "Évaluer si les compétences acquises sont effectivement utilisées en situation de travail, 3 à 6 mois après.",
		guidance:
			"Envoyez un questionnaire au stagiaire et à son manager. Cette évaluation est très valorisée lors des audits Qualiopi. Indicateurs n°11, 32.",
		subActions: [
			{ title: 'Envoyer le questionnaire au stagiaire et au manager' },
			{ title: 'Collecter les retours' },
			{
				title: 'Documenter les résultats',
				ctaType: 'upload',
				ctaLabel: 'Déposer les résultats',
				documentRequired: true
			}
		],
		dependencies: ['satisfaction_froid'],
		applicableTo: null,
		dueDateOffset: { days: 120, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 28
	},
	{
		key: 'bilan_formateur',
		phase: 'evaluation',
		title: 'Bilan formateur',
		description: "Recueillir le retour du formateur sur le déroulement de la formation.",
		guidance:
			"Le bilan formateur documente : déroulement, points forts/faibles, adaptations réalisées, recommandations. Input essentiel pour l'amélioration continue. Indicateurs Qualiopi n°30, 32.",
		subActions: [
			{ title: 'Envoyer le questionnaire de bilan' },
			{ title: 'Collecter le retour du formateur' },
			{
				title: "Documenter les points d'amélioration",
				ctaType: 'upload',
				ctaLabel: 'Déposer le bilan',
				documentRequired: true
			}
		],
		dependencies: ['satisfaction_chaud'],
		applicableTo: null,
		dueDateOffset: { days: 7, reference: 'dateFin' },
		criticalForQualiopi: false,
		orderIndex: 29
	},
	{
		key: 'amelioration_continue',
		phase: 'evaluation',
		title: 'Analyse et amélioration continue',
		description: "Analyser l'ensemble des retours et en tirer des actions d'amélioration concrètes.",
		guidance:
			"Analysez satisfaction à chaud, à froid, bilan formateur, évaluations. Mettez à jour le programme si nécessaire. Crucial pour le renouvellement Qualiopi. Indicateur n°32 (non-conformité majeure si absent).",
		subActions: [
			{ title: 'Analyser tous les retours collectés' },
			{ title: 'Identifier les actions d\'amélioration' },
			{
				title: 'Documenter le plan d\'actions correctives',
				ctaType: 'upload',
				ctaLabel: 'Déposer la fiche d\'amélioration',
				documentRequired: true
			},
			{
				title: 'Mettre à jour le programme si nécessaire',
				ctaType: 'navigate',
				ctaLabel: 'Voir le programme',
				ctaTarget: '/formations/[id]/programme'
			}
		],
		dependencies: ['satisfaction_chaud', 'satisfaction_froid', 'bilan_formateur'],
		applicableTo: null,
		dueDateOffset: { days: 90, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 30
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
			'evaluation_acquis_fin',
			'certificat_realisation',
			'attestation',
			'facturation',
			'bilan_formateur',
			'amelioration_continue'
		],
		applicableTo: null,
		dueDateOffset: { days: 120, reference: 'dateFin' },
		criticalForQualiopi: true,
		orderIndex: 31
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

	return actions.find((a) => {
		if (a.status !== 'Pas commencé') return false;
		const template = a.questKey ? getQuestTemplate(a.questKey) : null;
		if (!template || template.dependencies.length === 0) return true;
		return template.dependencies.every((depKey) =>
			actions.some((d) => d.questKey === depKey && d.status === 'Terminé')
		);
	});
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

	if (
		currentStatus === 'Financement' &&
		(isComplete('demande_financement') || isComplete('accord_opco') || isComplete('session_edof'))
	) {
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

export function getBlockingInfo(
	action: ActionRow,
	allActions: ActionRow[]
): { blocked: boolean; blockerNames: string[] } {
	if (action.status === 'Terminé') return { blocked: false, blockerNames: [] };
	const template = action.questKey ? getQuestTemplate(action.questKey) : null;
	if (!template || template.dependencies.length === 0) return { blocked: false, blockerNames: [] };

	const blockerNames: string[] = [];
	for (const depKey of template.dependencies) {
		const dep = allActions.find((a) => a.questKey === depKey);
		if (dep && dep.status !== 'Terminé') {
			const depTemplate = getQuestTemplate(depKey);
			blockerNames.push(depTemplate?.title ?? depKey);
		}
	}
	return { blocked: blockerNames.length > 0, blockerNames };
}

export function getPhaseQuests(phase: QuestPhase): QuestTemplate[] {
	return QUEST_TEMPLATES.filter((q) => q.phase === phase);
}
