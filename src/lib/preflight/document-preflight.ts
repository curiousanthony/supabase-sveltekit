export type PreflightSeverity = 'block' | 'warn' | 'prerequisite';
export type PreflightTab = 'fiche' | 'seances' | 'apprenants' | 'suivi' | 'documents';

export interface PreflightItem {
	id: string;
	severity: PreflightSeverity;
	kind: 'data' | 'prerequisite';
	messageFr: string;
	fixLabelFr: string;
	tab: PreflightTab;
	hrefPath: string;
	focusKey?: string;
}

export interface PreflightResult {
	items: PreflightItem[];
	blockingCount: number;
	warningCount: number;
}

export interface PreflightFormation {
	id: string;
	clientId: string | null;
	clientType: string | null;
	typeFinancement: string | null;
	dateDebut: string | null;
	dateFin: string | null;
}

export interface PreflightWorkspace {
	id: string;
	nda: string | null;
}

export interface PreflightContext {
	documentType: string;
	contactId?: string;
	formateurId?: string;
	seanceId?: string;
	hasAcceptedDevis?: boolean;
	hasLearnerWithEmail?: boolean;
	hasSignedConvention?: boolean;
	hasSignedEmargements?: boolean;
}

export class PreflightError extends Error {
	constructor(
		message: string,
		public readonly blockingItems: PreflightItem[]
	) {
		super(message);
		this.name = 'PreflightError';
	}
}

export function evaluatePreflight(
	formation: PreflightFormation,
	workspace: PreflightWorkspace,
	context: PreflightContext
): PreflightResult {
	const items: PreflightItem[] = [];
	const { documentType } = context;
	const formationId = formation.id;

	const base = (id: string): string => `/formations/${formationId}`;

	// ── Client manquant (devis, convention, convocation, certificat) ───────────
	const CLIENT_REQUIRED = new Set(['devis', 'convention', 'convocation', 'certificat']);
	if (CLIENT_REQUIRED.has(documentType) && !formation.clientId) {
		items.push({
			id: 'client_manquant',
			severity: 'block',
			kind: 'data',
			messageFr: 'Client non renseigné',
			fixLabelFr: 'Compléter le client sur la fiche formation',
			tab: 'fiche',
			hrefPath: `${base(formationId)}/fiche?preflightFocus=client`,
			focusKey: 'client'
		});
	}

	// ── devis ─────────────────────────────────────────────────────────────────
	if (documentType === 'devis') {
		// OPCO + pas de NDA → warn (for devis only)
		if (formation.typeFinancement === 'OPCO' && !workspace.nda) {
			items.push({
				id: 'nda_manquant',
				severity: 'warn',
				kind: 'data',
				messageFr: 'Numéro NDA manquant — requis pour un financement OPCO',
				fixLabelFr: 'Compléter le NDA dans les paramètres',
				tab: 'fiche',
				hrefPath: `${base(formationId)}/fiche?preflightFocus=nda`
			});
		}

		// B2C (Particulier) + formation dans moins de 10 jours → warn
		if (formation.clientType === 'Particulier' && formation.dateDebut) {
			const daysToStart = Math.ceil(
				(new Date(formation.dateDebut).getTime() - Date.now()) / 86_400_000
			);
			if (daysToStart < 10) {
				items.push({
					id: 'retractation_delai',
					severity: 'warn',
					kind: 'data',
					messageFr: `Délai de rétractation B2C — la formation commence dans ${daysToStart} jour(s)`,
					fixLabelFr: 'Vérifier la date de début',
					tab: 'fiche',
					hrefPath: `${base(formationId)}/fiche?preflightFocus=dateDebut`,
					focusKey: 'dateDebut'
				});
			}
		}
	}

	// ── convention ────────────────────────────────────────────────────────────
	if (documentType === 'convention') {
		if (context.hasAcceptedDevis !== true) {
			items.push({
				id: 'devis_non_accepte',
				severity: 'prerequisite',
				kind: 'prerequisite',
				messageFr: 'Le devis doit être accepté avant de générer la convention',
				fixLabelFr: 'Valider le devis dans le Suivi →',
				tab: 'suivi',
				hrefPath: `${base(formationId)}/suivi`
				// no focusKey — prerequisite items must not have focusKey
			});
		}
	}

	// ── feuille_emargement ────────────────────────────────────────────────────
	if (documentType === 'feuille_emargement') {
		if (!context.seanceId) {
			items.push({
				id: 'seance_manquante',
				severity: 'block',
				kind: 'data',
				messageFr: 'Aucune séance sélectionnée',
				fixLabelFr: 'Créer ou sélectionner une séance',
				tab: 'seances',
				hrefPath: `${base(formationId)}/seances`,
				focusKey: 'seances'
			});
		}
	}

	// ── convocation ───────────────────────────────────────────────────────────
	if (documentType === 'convocation') {
		if (!context.hasLearnerWithEmail) {
			items.push({
				id: 'email_apprenant_manquant',
				severity: 'block',
				kind: 'data',
				messageFr: 'Aucun apprenant avec adresse e-mail',
				fixLabelFr: "Compléter l'e-mail d'un apprenant",
				tab: 'apprenants',
				hrefPath: `${base(formationId)}/apprenants`,
				focusKey: 'email'
			});
		}

		if (context.hasSignedConvention !== true) {
			items.push({
				id: 'convention_non_signee',
				severity: 'prerequisite',
				kind: 'prerequisite',
				messageFr: "La convention doit être signée avant d'envoyer les convocations",
				fixLabelFr: 'Valider la convention dans le Suivi →',
				tab: 'suivi',
				hrefPath: `${base(formationId)}/suivi`
				// no focusKey — prerequisite
			});
		}
	}

	// ── certificat ────────────────────────────────────────────────────────────
	if (documentType === 'certificat') {
		if (context.hasSignedEmargements !== true) {
			items.push({
				id: 'emargements_non_signes',
				severity: 'block',
				kind: 'data',
				messageFr: "Les feuilles d'émargement ne sont pas toutes signées",
				fixLabelFr: 'Compléter les émargements',
				tab: 'seances',
				hrefPath: `${base(formationId)}/seances`,
				focusKey: 'emargements'
			});
		}

		// OPCO + pas de NDA → block (strict pour certificat)
		if (formation.typeFinancement === 'OPCO' && !workspace.nda) {
			items.push({
				id: 'nda_manquant',
				severity: 'block',
				kind: 'data',
				messageFr: 'Numéro NDA manquant — requis pour un financement OPCO (certificat)',
				fixLabelFr: 'Compléter le NDA dans les paramètres',
				tab: 'fiche',
				hrefPath: `${base(formationId)}/fiche?preflightFocus=nda`,
				focusKey: 'nda'
			});
		}
	}

	const blockingCount = items.filter(
		(i) => i.severity === 'block' || i.severity === 'prerequisite'
	).length;
	const warningCount = items.filter((i) => i.severity === 'warn').length;

	return { items, blockingCount, warningCount };
}

export function assertPreflightOrThrow(result: PreflightResult): void {
	if (result.blockingCount === 0) return;

	const blockingItems = result.items.filter(
		(i) => i.severity === 'block' || i.severity === 'prerequisite'
	);
	const ids = blockingItems.map((i) => i.id).join(', ');
	throw new PreflightError(
		`Génération impossible — ${result.blockingCount} blocage(s) : ${ids}`,
		blockingItems
	);
}
