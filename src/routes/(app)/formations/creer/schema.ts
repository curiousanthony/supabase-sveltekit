import { z } from 'zod';

export const formationSchema = z.object({
	name: z.string().min(1, 'Le nom de la formation est requis'),
	clientId: z.string().min(1, 'Le client est requis'),
	duree: z.number().min(1, 'La durée doit être supérieure à 0').default(7),
	modalite: z.enum(['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']).default('Présentiel'),
	type: z.enum(['Intra', 'Inter', 'CPF']).optional(),
	topicId: z.string().optional(),
	customTopic: z.string().optional(),
	targetPublicIds: z.array(z.string()).default([]),
	prerequisiteIds: z.array(z.string()).default([]),
	customPrerequisites: z.array(z.string()).default([]),
	dateDebut: z.string().optional(),
	dateFin: z.string().optional(),
	location: z.string().optional(),
	programmeSourceId: z.string().optional(),

	modules: z
		.array(
			z.object({
				title: z.string().min(1, 'Le titre du module est requis'),
				durationHours: z.number().min(0.5, 'La durée doit être supérieure à 0').default(1),
				objectifs: z.string().min(1, 'Les objectifs sont requis')
			})
		)
		.min(1, 'Au moins un module est requis'),

	description: z.string().optional(),
	evaluationMode: z.string().min(1, "Le mode d'évaluation est requis pour Qualiopi"),
	suiviAssiduite: z.string().min(1, "Le suivi de l'assiduité est requis pour Qualiopi")
});

export type FormationSchema = z.infer<typeof formationSchema>;
