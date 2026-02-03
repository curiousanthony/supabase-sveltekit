// Phase 1: Dummy data only - no DB queries
import type { PageServerLoad } from './$types';
import { workflowStepKeys } from '$lib/db/schema';

// French labels for the 10 steps
const stepLabels: Record<string, string> = {
	info_verification: 'Vérifications des informations',
	convention_program: 'Convention et programme',
	needs_analysis: 'Analyse des besoins',
	convocation: 'Convocation',
	mission_order: 'Ordre de mission',
	end_certificate: 'Attestation de fin de mission',
	satisfaction_questionnaires: 'Questionnaires de satisfaction',
	instructor_documents: 'Documents formateur',
	billing: 'Facturation',
	complete_file: 'Dossier complet'
};

// Primary button labels per step
const stepPrimaryButtons: Record<string, string> = {
	info_verification: 'Vérifier les infos',
	convention_program: 'Générer la convention',
	needs_analysis: 'Programmer',
	convocation: 'Générer pour tous',
	mission_order: 'Générer',
	end_certificate: 'Générer pour tous',
	satisfaction_questionnaires: 'Ajouter apprenants',
	instructor_documents: 'Voir documents',
	billing: 'Configurer',
	complete_file: 'Voir dossier'
};

export const load = (async ({ params }) => {
	// Phase 1: Dummy data only - no DB queries
	const dummyFormation = {
		id: params.id,
		name: 'Formation pilot',
		client: { legalName: 'Acme SA' },
		dates: { start: '2026-03-01', end: '2026-03-15' },
		typeFinancement: 'OPCO',
		statut: 'En cours',
		duree: 24,
		lieu: 'Paris',
		format: 'Présentiel',
		thematique: { name: 'Management' },
		description: 'Formation de pilotage pour managers'
	};

	const progress = { completed: 3, total: 10 };

	// Build steps array with dummy statuses
	const steps = workflowStepKeys.map((key, index) => {
		let status: 'done' | 'in_progress' | 'to_do';
		if (index < 3) {
			status = 'done';
		} else if (index === 3) {
			status = 'in_progress';
		} else {
			status = 'to_do';
		}

		return {
			key,
			label: stepLabels[key],
			status,
			primaryButton: stepPrimaryButtons[key] || "Valider l'étape",
			stepNumber: index + 1
		};
	});

	const dummyLearners = [
		{ id: '1', firstName: 'Jean', lastName: 'Dupont', email: 'jean.dupont@example.com' },
		{ id: '2', firstName: 'Marie', lastName: 'Martin', email: 'marie.martin@example.com' },
		{ id: '3', firstName: 'Pierre', lastName: 'Bernard', email: 'pierre.bernard@example.com' },
		{ id: '4', firstName: 'Sophie', lastName: 'Dubois', email: 'sophie.dubois@example.com' }
	];

	const dummyModules = [
		{ id: '1', name: 'Module 1: Introduction' },
		{ id: '2', name: 'Module 2: Approfondissement' }
	];

	const dummyFormateurs = [
		{ id: '1', name: 'Formateur A' },
		{ id: '2', name: 'Formateur B' },
		{ id: '3', name: 'Formateur C' }
	];

	const dummySeances = [
		{ id: '1', date: '2026-03-01', startTime: '09:00', endTime: '12:00' },
		{ id: '2', date: '2026-03-02', startTime: '09:00', endTime: '12:00' },
		{ id: '3', date: '2026-03-03', startTime: '09:00', endTime: '12:00' },
		{ id: '4', date: '2026-03-04', startTime: '09:00', endTime: '12:00' },
		{ id: '5', date: '2026-03-05', startTime: '09:00', endTime: '12:00' }
	];

	const pageName = dummyFormation.name;

	const header = {
		pageName: dummyFormation.name,
		actions: [
			{
				type: 'badge' as const,
				icon: 'circle',
				text: dummyFormation.statut,
				variant: 'outline' as const,
				className: '[&_svg]:text-yellow-400 select-none'
			}
		],
		backButtonLabel: 'Formations',
		backButtonHref: '/formations',
		backButton: true
	};

	return {
		formation: dummyFormation,
		progress,
		steps,
		learners: dummyLearners,
		modules: dummyModules,
		formateurs: dummyFormateurs,
		seances: dummySeances,
		pageName,
		header
	};
}) satisfies PageServerLoad;
