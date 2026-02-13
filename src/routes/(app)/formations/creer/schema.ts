import { z } from 'zod';

export const formationSchema = z.object({
	// Step 1: Informations de base
	name: z.string().min(1, 'Le nom de la formation est requis'),
	clientId: z.string().min(1, 'Le client est requis'),
	duree: z.number().min(1, 'La durée doit être supérieure à 0').default(7),
	modalite: z.enum(['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']).default('Présentiel'),
	topicId: z.string().optional(),
	customTopic: z.string().optional(),
	targetPublicIds: z.array(z.string()).default([]),
	prerequisiteIds: z.array(z.string()).default([]),
	customPrerequisites: z.array(z.string()).default([]),

	// Step 2: Modules (per-module evaluation)
	modules: z
		.array(
			z.object({
				title: z.string().min(1, 'Le titre du module est requis'),
				durationHours: z.number().min(0.5, 'La durée doit être supérieure à 0').default(1),
				objectifs: z.string().min(1, 'Les objectifs sont requis'),
				modaliteEvaluation: z.enum([
					'QCM de fin de formation',
					'Mise en situation pratique',
					'Étude de cas complexe',
					'Entretien avec le formateur'
				])
			})
		)
		.min(1, 'Au moins un module est requis'),

	// Step 3: Conformité Qualiopi (suivi assiduité only; evaluation is per-module)
	description: z.string().optional(),
	suiviAssiduite: z.string().min(1, "Le suivi de l'assiduité est requis pour Qualiopi")
});

export type FormationSchema = z.infer<typeof formationSchema>;
