import type { InferSelectModel } from 'drizzle-orm';
import type { formationActions } from '$lib/db/schema';

export type QuestPhase = 'conception' | 'deploiement' | 'evaluation';

export type InlineType =
	| 'verify-fields'
	| 'upload-document'
	| 'generate-document'
	| 'select-people'
	| 'send-email'
	| 'external-link'
	| 'wait-external'
	| 'confirm-task'
	| 'inline-view';

export interface VerifyFieldConfig {
	fields: { key: string; label: string; type: 'text' | 'textarea' | 'date' | 'number' | 'select' | 'company-display'; options?: string[] }[];
}

export interface GenerateDocumentConfig {
	documentType: string;
}

export interface SelectPeopleConfig {
	peopleType: 'formateur' | 'apprenant';
}

export interface SendEmailConfig {
	emailType: string;
	recipientType: 'client' | 'apprenant' | 'formateur' | 'financeur';
}

export interface ExternalLinkConfig {
	url?: string;
	label?: string;
}

export interface WaitExternalConfig {
	waitingFor: string;
	reminderEmailType?: string;
}

export interface InlineViewConfig {
	viewType: 'seances' | 'finances' | 'programme' | 'apprenants' | 'formateurs';
}

export interface UploadDocumentConfig {
	acceptedFileTypes?: string[];
	label?: string;
}

export type InlineConfig =
	| VerifyFieldConfig
	| GenerateDocumentConfig
	| SelectPeopleConfig
	| SendEmailConfig
	| ExternalLinkConfig
	| WaitExternalConfig
	| InlineViewConfig
	| UploadDocumentConfig
	| Record<string, unknown>;

export interface SubActionTemplate {
	title: string;
	description?: string;
	inlineType: InlineType;
	inlineConfig?: InlineConfig;
	/** @deprecated Use inlineType instead */
	ctaType?: 'navigate' | 'upload' | 'external' | null;
	/** @deprecated Use inlineConfig instead */
	ctaLabel?: string;
	/** @deprecated Use inlineType instead */
	ctaTarget?: string;
	documentRequired?: boolean;
	acceptedFileTypes?: string[];
}

export interface QuestTemplate {
	key: string;
	phase: QuestPhase;
	title: string;
	/** Action-oriented copy used in the HUD banner and quest rows (e.g. "Envoyer les convocations aux apprenants"). Falls back to `title` if absent. */
	actionTitle?: string;
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
		actionTitle: 'Vérifier la fiche formation',
		description: 'Vérifier que toutes les informations de la formation sont complètes et correctes.',
		guidance:
			"Passez en revue chaque champ de la fiche formation : intitulé, durée, dates, modalité, client. C'est la base du dossier Qualiopi.",
		subActions: [
			{
				title: "Vérifier l'intitulé et la description",
				description: "L'intitulé figure sur tous les documents officiels (convention, certificat).",
				inlineType: 'verify-fields',
				inlineConfig: {
					fields: [
						{ key: 'name', label: 'Intitulé', type: 'text' },
						{ key: 'description', label: 'Description', type: 'textarea' }
					]
				}
			},
			{
				title: 'Confirmer les dates de début et de fin',
				description: "Les dates conditionnent le calcul automatique des échéances.",
				inlineType: 'verify-fields',
				inlineConfig: {
					fields: [
						{ key: 'dateDebut', label: 'Date de début', type: 'date' },
						{ key: 'dateFin', label: 'Date de fin', type: 'date' }
					]
				}
			},
			{
				title: 'Vérifier la modalité et la durée',
				inlineType: 'verify-fields',
				inlineConfig: {
					fields: [
						{ key: 'modalite', label: 'Modalité', type: 'select', options: ['Présentiel', 'Distanciel', 'Hybride', 'E-Learning'] },
						{ key: 'duree', label: 'Durée (heures)', type: 'number' }
					]
				}
			},
			{
				title: 'Confirmer les informations client',
				description: "Le client apparaît sur la convention et la facturation.",
				inlineType: 'verify-fields',
				inlineConfig: {
					fields: [{ key: 'client', label: 'Client', type: 'company-display' }]
				}
			}
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
		actionTitle: 'Analyser les besoins des apprenants',
		description: "Recueillir et analyser les besoins de formation des apprenants et du donneur d'ordre.",
		guidance:
			"Envoyez un questionnaire d'analyse des besoins aux apprenants et/ou à leur manager. Les réponses permettront d'adapter le programme. Indicateur Qualiopi n°4.",
		subActions: [
			{ title: 'Choisir ou créer le questionnaire de besoins', inlineType: 'confirm-task' },
			{
				title: 'Envoyer aux apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'analyse_besoins', recipientType: 'apprenant' }
			},
			{ title: 'Collecter les réponses', inlineType: 'wait-external', inlineConfig: { waitingFor: 'Apprenants' } },
			{
				title: 'Partager les résultats avec le formateur',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'analyse_besoins_resultats', recipientType: 'formateur' }
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
		actionTitle: 'Finaliser le programme et les modules',
		description: "Confirmer le programme de formation, les modules et les objectifs pédagogiques.",
		guidance:
			"Associez un programme depuis la bibliothèque ou créez-en un sur mesure. Vérifiez les objectifs pédagogiques et les modalités d'évaluation. Indicateurs Qualiopi n°5 et n°6.",
		subActions: [
			{
				title: 'Associer ou créer le programme',
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'programme' }
			},
			{
				title: 'Vérifier les modules et leur durée',
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'programme' }
			},
			{ title: 'Confirmer les objectifs pédagogiques', inlineType: 'confirm-task' },
			{ title: "Valider les modalités d'évaluation", inlineType: 'confirm-task' }
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
		actionTitle: 'Établir et envoyer le devis',
		description: "Rédiger et envoyer un devis détaillé au client avec les tarifs, durée et conditions.",
		guidance:
			"Le devis doit mentionner : intitulé, dates, durée, nombre de stagiaires, coût HT/TTC, conditions de paiement et d'annulation. Indicateur Qualiopi n°1.",
		subActions: [
			{
				title: 'Générer le devis',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'devis' }
			},
			{
				title: 'Envoyer au client',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'devis_envoi', recipientType: 'client' }
			},
			{
				title: 'Obtenir la validation du devis',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Client', reminderEmailType: 'devis_relance' }
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
		actionTitle: 'Envoyer la convention de formation',
		description: "Générer, envoyer et faire signer la convention de formation au client.",
		guidance:
			"La convention formalise l'accord entre l'organisme et le client. Elle doit être signée avant le début de la formation. Indicateur Qualiopi n°6.",
		subActions: [
			{
				title: 'Générer la convention',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'convention' }
			},
			{ title: 'Relire et personnaliser si nécessaire', inlineType: 'confirm-task' },
			{
				title: 'Envoyer au client',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'convention_envoi', recipientType: 'client' }
			},
			{
				title: 'Obtenir la signature',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Client', reminderEmailType: 'convention_relance' }
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
		actionTitle: 'Déposer le dossier de financement OPCO',
		description: "Constituer et déposer le dossier de demande de prise en charge auprès de l'OPCO.",
		guidance:
			"La demande OPCO doit être déposée au moins 15 jours à 2 mois avant J0. Le dossier comprend : convention, programme, devis, formulaire OPCO, infos salariés.",
		subActions: [
			{ title: 'Préparer le dossier de financement', inlineType: 'confirm-task' },
			{
				title: "Déposer sur la plateforme OPCO",
				inlineType: 'external-link',
				inlineConfig: { label: 'Ouvrir la plateforme OPCO' }
			},
			{
				title: "Suivre l'état de la demande",
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'OPCO' }
			}
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
		actionTitle: "Réceptionner l'accord de l'OPCO",
		description: "Réceptionner et vérifier l'accord de prise en charge émis par l'OPCO.",
		guidance:
			"Vérifiez que le montant accordé correspond au devis. En cas de prise en charge partielle, informez le client du reste à charge.",
		subActions: [
			{
				title: "Réceptionner l'accord de prise en charge",
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'OPCO' }
			},
			{
				title: 'Vérifier le montant accordé',
				inlineType: 'verify-fields',
				inlineConfig: {
					fields: [{ key: 'montantAccorde', label: 'Montant accordé', type: 'number' }]
				}
			},
			{
				title: "Archiver l'accord",
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: "Déposer l'accord OPCO" }
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
		actionTitle: 'Ouvrir la session sur EDOF',
		description: "Créer ou ouvrir une session sur la plateforme EDOF (Mon Compte Formation) pour les formations CPF.",
		guidance:
			"Définissez : dates, lieu, modalités, nombre de places. Le stagiaire s'inscrit via son espace Mon Compte Formation. Validez la demande sous 2 jours ouvrés.",
		subActions: [
			{
				title: 'Créer la session sur EDOF',
				inlineType: 'external-link',
				inlineConfig: { url: 'https://www.of.moncompteformation.gouv.fr', label: 'Ouvrir EDOF' }
			},
			{
				title: "Valider l'inscription du stagiaire",
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Stagiaire (via Mon Compte Formation)' }
			},
			{ title: 'Confirmer le financement', inlineType: 'confirm-task' }
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
		actionTitle: 'Envoyer les convocations aux apprenants',
		description: "Générer et envoyer les convocations aux apprenants avec les informations pratiques.",
		guidance:
			"Chaque apprenant doit recevoir une convocation contenant : lieu, date, horaires, programme, documents à apporter. Indicateur Qualiopi n°9.",
		subActions: [
			{
				title: 'Générer les convocations',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'convocation' }
			},
			{
				title: "Joindre le livret d'accueil",
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: "Déposer le livret d'accueil" }
			},
			{
				title: 'Envoyer à tous les apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'convocation', recipientType: 'apprenant' }
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
		actionTitle: 'Transmettre le règlement intérieur aux stagiaires',
		description: "Transmettre le règlement intérieur de l'organisme aux stagiaires avant ou au début de la formation.",
		guidance:
			"Obligatoire pour les formations > 500h, fortement recommandé pour toutes. Couvre : hygiène, sécurité, discipline, sanctions. Indicateur Qualiopi n°9.",
		subActions: [
			{
				title: 'Préparer le règlement intérieur',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer le règlement' }
			},
			{
				title: 'Transmettre aux stagiaires',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'reglement_interieur', recipientType: 'apprenant' }
			}
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
		actionTitle: 'Envoyer le test de positionnement aux apprenants',
		description: "Évaluer le niveau initial des apprenants avant la formation.",
		guidance:
			"Le test de positionnement permet d'adapter le contenu aux besoins réels. Il sera comparé au test final pour mesurer la progression. Indicateur Qualiopi n°8.",
		subActions: [
			{ title: 'Choisir ou créer le test de positionnement', inlineType: 'confirm-task' },
			{ title: "Configurer l'envoi", inlineType: 'confirm-task' },
			{
				title: 'Envoyer aux apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'test_positionnement', recipientType: 'apprenant' }
			},
			{
				title: 'Collecter les résultats',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Apprenants' }
			}
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
		actionTitle: 'Préparer la logistique de la formation',
		description: "Préparer l'environnement de formation : salle, matériel, supports, accessibilité.",
		guidance:
			"Réservez la salle, vérifiez le matériel (vidéoprojecteur, PC, connexion), préparez les supports pédagogiques, vérifiez l'accessibilité PMR. Indicateur Qualiopi n°17.",
		subActions: [
			{ title: 'Réserver la salle / vérifier le lien visio', inlineType: 'confirm-task' },
			{ title: 'Vérifier le matériel technique', inlineType: 'confirm-task' },
			{ title: 'Préparer les supports pédagogiques', inlineType: 'confirm-task' },
			{ title: "Vérifier l'accessibilité PMR", inlineType: 'confirm-task' }
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
		actionTitle: 'Affecter et vérifier le formateur',
		description: "Désigner le formateur et vérifier l'adéquation de ses compétences avec le contenu.",
		guidance:
			"Vérifiez les qualifications du formateur (CV, diplômes, expérience). Si sous-traitant : contrat de prestation + déclaration obligatoire. Indicateurs Qualiopi n°17, 21, 27.",
		subActions: [
			{
				title: 'Affecter le formateur',
				inlineType: 'select-people',
				inlineConfig: { peopleType: 'formateur' }
			},
			{
				title: 'Vérifier les qualifications',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'], label: 'Déposer le CV' }
			},
			{ title: 'Formaliser le contrat (si sous-traitant)', inlineType: 'confirm-task' }
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
		actionTitle: "Envoyer l'ordre de mission au formateur",
		description: "Générer et envoyer l'ordre de mission au formateur.",
		guidance:
			"L'ordre de mission détaille les conditions d'intervention : dates, lieu, contenu, rémunération. Le formateur doit le retourner signé.",
		subActions: [
			{
				title: "Générer l'ordre de mission",
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'ordre_mission' }
			},
			{
				title: 'Envoyer au formateur',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'ordre_mission_envoi', recipientType: 'formateur' }
			},
			{
				title: 'Collecter la copie signée',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Formateur', reminderEmailType: 'ordre_mission_relance' }
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
		actionTitle: 'Collecter les documents administratifs du formateur',
		description: "S'assurer que tous les documents administratifs du formateur sont à jour.",
		guidance:
			"Vérifiez que le formateur a fourni : CV à jour, diplômes, attestation URSSAF, SIRET, NDA. Relancez si des documents manquent. Indicateur Qualiopi n°21.",
		subActions: [
			{
				title: 'Vérifier le CV à jour',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'], label: 'Déposer le CV' }
			},
			{
				title: 'Vérifier les diplômes',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'], label: 'Déposer les diplômes' }
			},
			{
				title: 'Vérifier NDA / URSSAF / SIRET',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'], label: 'Déposer les justificatifs' }
			},
			{
				title: 'Relancer pour les documents manquants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'relance_documents_formateur', recipientType: 'formateur' }
			}
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
		actionTitle: 'Accueillir les apprenants et lancer la formation',
		description: "Accueillir les apprenants et lancer la formation.",
		guidance:
			"Vérifiez que la logistique est prête (salle, matériel, accès distanciel). Accueillez les apprenants, faites le tour de table et distribuez les supports. Indicateurs Qualiopi n°9, 10.",
		subActions: [
			{ title: 'Vérifier la logistique (salle, matériel, lien visio)', inlineType: 'confirm-task' },
			{ title: 'Accueillir les apprenants et faire le tour de table', inlineType: 'confirm-task' },
			{ title: 'Distribuer les supports et le livret d\'accueil', inlineType: 'confirm-task' },
			{ title: 'Recueillir les attentes des participants', inlineType: 'confirm-task' }
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
		actionTitle: 'Vérifier et collecter les feuilles de présence',
		description: "S'assurer que les feuilles de présence sont signées par tous les participants.",
		guidance:
			"L'émargement est obligatoire (art. R.6313-3). Vérifiez que les émargements sont bien configurés et que les apprenants signent.",
		subActions: [
			{
				title: 'Vérifier que les émargements sont configurés',
				description: "Ouvrez l'onglet Séances et vérifiez que chaque séance a ses émargements prêts.",
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'seances' }
			},
			{
				title: 'Relancer les signatures manquantes',
				description: "Envoyez un rappel aux apprenants qui n'ont pas encore signé.",
				inlineType: 'send-email',
				inlineConfig: { emailType: 'rappel_emargement', recipientType: 'apprenant' }
			}
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
		actionTitle: 'Animer la formation et documenter le déroulé',
		description: "Dérouler le contenu pédagogique conformément au programme et adapter le rythme au groupe.",
		guidance:
			"Suivez le déroulé pédagogique. Documentez tout écart significatif par rapport au programme prévu et justifiez les adaptations. Indicateurs Qualiopi n°6, 10, 19.",
		subActions: [
			{
				title: 'Confirmer le déroulement du programme',
				description: "Vérifiez que les modules prévus correspondent au contenu réellement dispensé.",
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'programme' }
			},
			{
				title: 'Distribuer les supports pédagogiques',
				inlineType: 'confirm-task'
			},
			{
				title: 'Documenter les écarts éventuels',
				description: "Si le contenu a été adapté, téléversez un document justifiant les modifications.",
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: "Déposer les notes d'adaptation" }
			}
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
		actionTitle: 'Réaliser les évaluations en cours de formation',
		description: "Réaliser des évaluations en cours de formation pour mesurer la progression.",
		guidance:
			"Des évaluations en cours de formation (quiz, exercices pratiques, mises en situation) permettent de vérifier l'acquisition des compétences et d'adapter le contenu. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Réaliser les évaluations prévues', inlineType: 'confirm-task' },
			{
				title: 'Consigner les résultats',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer les résultats' }
			},
			{ title: 'Adapter le contenu si nécessaire', inlineType: 'confirm-task' }
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
		actionTitle: 'Documenter et signaler les absences',
		description: "Documenter les absences et prévenir les abandons.",
		guidance:
			"Enregistrez toute absence, informez le client et/ou le financeur si nécessaire. Documentez les justificatifs. Indicateur Qualiopi n°12.",
		subActions: [
			{
				title: 'Vérifier la présence sur les émargements',
				description: "Passez en revue les séances pour identifier les absences non justifiées.",
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'seances' }
			},
			{
				title: 'Informer le client des absences',
				description: "Si des absences significatives sont constatées, prévenez le donneur d'ordre.",
				inlineType: 'send-email',
				inlineConfig: { emailType: 'notification_absence', recipientType: 'client' }
			},
			{
				title: 'Archiver les justificatifs d\'absence',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf', 'image/jpeg', 'image/png'], label: 'Déposer les justificatifs' }
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
		title: 'Bilan intermédiaire et adaptations',
		actionTitle: 'Faire le bilan intermédiaire et adapter le contenu',
		description: "Ajuster le contenu en fonction des évaluations et documenter les modifications.",
		guidance:
			"Adaptez le rythme, approfondissez des sujets, modifiez les exercices selon les besoins. Documentez ces adaptations et justifiez-les. Indicateur Qualiopi n°10.",
		subActions: [
			{
				title: 'Rédiger le bilan intermédiaire',
				description: "Synthétisez les résultats des évaluations formatives et les retours du formateur.",
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer le bilan intermédiaire' }
			},
			{
				title: 'Confirmer les adaptations appliquées',
				description: "Si le contenu a été modifié, confirmez que le programme mis à jour est cohérent.",
				inlineType: 'confirm-task'
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
		actionTitle: 'Envoyer le questionnaire de satisfaction à chaud',
		description: "Recueillir la satisfaction immédiate des apprenants et du donneur d'ordre.",
		guidance:
			"Envoyez le questionnaire de satisfaction le jour de la fin de la formation ou le lendemain. Prévoyez des relances à J+2 et J+5. Indicateur Qualiopi n°30 (non-conformité majeure si absent).",
		subActions: [
			{ title: 'Choisir ou créer le questionnaire apprenants', inlineType: 'confirm-task' },
			{
				title: 'Envoyer aux apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'satisfaction_chaud', recipientType: 'apprenant' }
			},
			{
				title: "Envoyer au donneur d'ordre (client)",
				inlineType: 'send-email',
				inlineConfig: { emailType: 'satisfaction_chaud_client', recipientType: 'client' }
			},
			{
				title: 'Collecter et analyser les réponses',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Apprenants et client' }
			}
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
		actionTitle: 'Évaluer les acquis et comparer au positionnement initial',
		description: "Évaluer l'atteinte des objectifs pédagogiques par chaque stagiaire et comparer avec le positionnement initial.",
		guidance:
			"Administrez le test final (même format que le positionnement). Comparez les résultats pour mesurer la montée en compétences. Les résultats doivent être documentés individuellement. Indicateur Qualiopi n°11.",
		subActions: [
			{ title: 'Administrer le test final', inlineType: 'confirm-task' },
			{
				title: 'Consigner les résultats individuels',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer les résultats' }
			},
			{ title: 'Comparer avec le test de positionnement', inlineType: 'confirm-task' }
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
		actionTitle: 'Émettre et envoyer les certificats de réalisation',
		description: "Générer et envoyer le certificat de réalisation à chaque apprenant.",
		guidance:
			"Le certificat atteste de la participation effective (art. R.6332-26). Il doit mentionner : identité, nature de l'action, dates, durée effective. Obligatoire pour les financements OPCO/CPF.",
		subActions: [
			{
				title: 'Vérifier les données de présence',
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'seances' }
			},
			{
				title: 'Générer les certificats',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'certificat' }
			},
			{
				title: 'Envoyer aux apprenants et au financeur',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'certificat_realisation', recipientType: 'apprenant' }
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
		actionTitle: 'Délivrer les attestations de fin de formation',
		description: "Délivrer l'attestation de fin de formation individuelle mentionnant les acquis réels.",
		guidance:
			"L'attestation mentionne les objectifs, la nature et la durée de l'action, les compétences acquises et les résultats de l'évaluation. Indicateur Qualiopi n°11.",
		subActions: [
			{
				title: 'Générer les attestations',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'attestation' }
			},
			{
				title: 'Envoyer aux apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'attestation_fin_formation', recipientType: 'apprenant' }
			},
			{
				title: 'Archiver les copies',
				inlineType: 'confirm-task'
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
		actionTitle: 'Émettre et envoyer la facture',
		description: "Émettre et envoyer la facture au client ou à l'OPCO.",
		guidance:
			"Générez la facture avec les informations de la convention. Pour les financements OPCO en subrogation, adressez-la directement à l'OPCO. Pour le CPF, saisissez-la dans EDOF.",
		subActions: [
			{
				title: 'Générer la facture',
				inlineType: 'generate-document',
				inlineConfig: { documentType: 'facture' }
			},
			{
				title: "Envoyer au client ou à l'OPCO",
				inlineType: 'send-email',
				inlineConfig: { emailType: 'facture_envoi', recipientType: 'client' }
			},
			{
				title: 'Suivre le paiement',
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'finances' }
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
		actionTitle: 'Envoyer les justificatifs au financeur (OPCO / EDOF)',
		description: "Compiler et envoyer les pièces justificatives à l'OPCO ou déclarer le service fait sur EDOF.",
		guidance:
			"OPCO : envoyez convention, émargements, certificat de réalisation, facture. CPF : déclarez le service fait sur EDOF. La CDC règle sous 30 jours.",
		subActions: [
			{
				title: 'Compiler le dossier justificatif',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer les justificatifs' }
			},
			{
				title: "Envoyer à l'OPCO / déclarer sur EDOF",
				inlineType: 'external-link',
				inlineConfig: { label: "Ouvrir la plateforme de l'OPCO / EDOF" }
			},
			{
				title: 'Suivre la validation',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'OPCO / Caisse des Dépôts' }
			}
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
		actionTitle: 'Envoyer le questionnaire de satisfaction à froid (J+60)',
		description: "Évaluer l'impact de la formation 1 à 3 mois après sa fin.",
		guidance:
			"Le questionnaire à froid mesure le transfert des acquis en situation de travail. Envoyez-le aussi au commanditaire (entreprise). Indicateur Qualiopi n°30.",
		subActions: [
			{ title: "Programmer l'envoi à J+60", inlineType: 'confirm-task' },
			{
				title: 'Envoyer aux apprenants',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'satisfaction_froid', recipientType: 'apprenant' }
			},
			{
				title: 'Envoyer au commanditaire (entreprise)',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'satisfaction_froid_client', recipientType: 'client' }
			},
			{
				title: 'Collecter et analyser les réponses',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Apprenants et entreprise' }
			}
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
		actionTitle: 'Évaluer le transfert des acquis en situation de travail',
		description: "Évaluer si les compétences acquises sont effectivement utilisées en situation de travail, 3 à 6 mois après.",
		guidance:
			"Envoyez un questionnaire au stagiaire et à son manager. Cette évaluation est très valorisée lors des audits Qualiopi. Indicateurs n°11, 32.",
		subActions: [
			{
				title: 'Envoyer le questionnaire au stagiaire et au manager',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'evaluation_transfert', recipientType: 'apprenant' }
			},
			{
				title: 'Collecter les retours',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Stagiaire et manager' }
			},
			{
				title: 'Documenter les résultats',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer les résultats' }
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
		actionTitle: 'Recueillir le bilan du formateur',
		description: "Recueillir le retour du formateur sur le déroulement de la formation.",
		guidance:
			"Le bilan formateur documente : déroulement, points forts/faibles, adaptations réalisées, recommandations. Input essentiel pour l'amélioration continue. Indicateurs Qualiopi n°30, 32.",
		subActions: [
			{
				title: 'Envoyer le questionnaire de bilan',
				inlineType: 'send-email',
				inlineConfig: { emailType: 'bilan_formateur', recipientType: 'formateur' }
			},
			{
				title: 'Collecter le retour du formateur',
				inlineType: 'wait-external',
				inlineConfig: { waitingFor: 'Formateur' }
			},
			{
				title: "Documenter les points d'amélioration",
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: 'Déposer le bilan' }
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
		actionTitle: 'Analyser les retours et planifier les améliorations',
		description: "Analyser l'ensemble des retours et en tirer des actions d'amélioration concrètes.",
		guidance:
			"Analysez satisfaction à chaud, à froid, bilan formateur, évaluations. Mettez à jour le programme si nécessaire. Crucial pour le renouvellement Qualiopi. Indicateur n°32 (non-conformité majeure si absent).",
		subActions: [
			{ title: 'Analyser tous les retours collectés', inlineType: 'confirm-task' },
			{ title: 'Identifier les actions d\'amélioration', inlineType: 'confirm-task' },
			{
				title: 'Documenter le plan d\'actions correctives',
				inlineType: 'upload-document',
				inlineConfig: { acceptedFileTypes: ['application/pdf'], label: "Déposer la fiche d'amélioration" }
			},
			{
				title: 'Mettre à jour le programme si nécessaire',
				inlineType: 'inline-view',
				inlineConfig: { viewType: 'programme' }
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
		actionTitle: 'Clôturer et archiver le dossier de formation',
		description: "Vérifier la complétude du dossier et archiver l'ensemble des documents.",
		guidance:
			"Passez en revue tous les documents du dossier. Archivez-les pour une durée minimale de 5 ans (exigence Qualiopi). Marquez la formation comme terminée.",
		subActions: [
			{ title: 'Vérifier la présence de tous les documents', inlineType: 'confirm-task' },
			{ title: 'Archiver le dossier complet', inlineType: 'confirm-task' },
			{ title: 'Marquer la formation comme terminée', inlineType: 'confirm-task' }
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

/** First YYYY-MM-DD in a string (Postgres date or ISO datetime). */
function parseCivilDateParts(value: string | Date | null | undefined): {
	y: number;
	m: number;
	d: number;
} | null {
	if (value == null) return null;
	if (value instanceof Date) {
		if (Number.isNaN(value.getTime())) return null;
		return { y: value.getFullYear(), m: value.getMonth() + 1, d: value.getDate() };
	}
	const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
	if (!m) return null;
	return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function formatCivilDateParts(y: number, m: number, d: number): string {
	return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Add calendar days to a civil date (formation start/end); avoids UTC/local mixing from Date parsing + toISOString(). */
export function addCalendarDaysToCivilDate(isoOrDate: string | Date, deltaDays: number): string {
	const parts = parseCivilDateParts(isoOrDate);
	if (!parts) {
		if (typeof isoOrDate === 'string') return isoOrDate.slice(0, 10);
		return formatCivilDateParts(
			isoOrDate.getFullYear(),
			isoOrDate.getMonth() + 1,
			isoOrDate.getDate()
		);
	}
	const dt = new Date(parts.y, parts.m - 1, parts.d);
	dt.setDate(dt.getDate() + deltaDays);
	return formatCivilDateParts(dt.getFullYear(), dt.getMonth() + 1, dt.getDate());
}

/**
 * Days from today (local calendar) until due date (YYYY-MM-DD = civil date).
 * Negative = overdue. Null if unparseable.
 */
export function civilDaysFromTodayUntilDue(dueIso: string | null, now: Date = new Date()): number | null {
	if (!dueIso) return null;
	const parts = parseCivilDateParts(dueIso);
	if (!parts) return null;
	const due = new Date(parts.y, parts.m - 1, parts.d);
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	return Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
		dueDates.set(q.key, addCalendarDaysToCivilDate(refDate, q.dueDateOffset.days));
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

/** Returns the action-oriented display title, falling back to `title`. */
export function getQuestActionTitle(template: QuestTemplate): string {
	return template.actionTitle ?? template.title;
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
