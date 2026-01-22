import { z } from 'zod';

export const formationSchema = z.object({
	// Step 1: L'Essentiel
	name: z.string().min(1, 'Le nom est requis'),
	topicId: z.string().optional().nullable(),

	// Step 2: La Logistique
	modalite: z.enum(['Distanciel', 'Présentiel', 'Hybride', 'E-Learning']).default('Distanciel'),
	duree: z.number().min(0).default(0),

	// Step 3: Le Cadre
	typeFinancement: z.enum(['CPF', 'OPCO', 'Inter', 'Intra']).default('OPCO'),
	codeRncp: z.string().optional()
});

export type FormationSchema = z.infer<typeof formationSchema>;
