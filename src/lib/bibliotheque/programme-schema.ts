import { z } from 'zod';

export const modaliteOptions = ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as const;
export const statutOptions = ['Brouillon', 'En cours', 'Publié', 'Archivé'] as const;
export const prerequisOptions = [
	'Vidéoprojecteur',
	'Ordinateur',
	'Connaissances en bureautique',
	'Connexion internet'
] as const;

export const programmeSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	description: z.string().optional(),
	modalite: z.enum(modaliteOptions).optional().nullable(),
	prixPublic: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z.coerce.number().positive('Le prix doit être positif').optional().nullable()
	),
	statut: z.enum(statutOptions).default('Brouillon'),
	prerequis: z.preprocess(
		(val) => {
			if (val == null || val === '') return [];
			if (typeof val === 'string') {
				try {
					return JSON.parse(val) as unknown;
				} catch {
					return [];
				}
			}
			return val;
		},
		z.array(z.enum(prerequisOptions)).optional().default([])
	),
	dureeHeures: z.preprocess(
		(val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
		z.coerce.number().positive('La durée doit être positive').optional().nullable()
	),
	moduleIds: z.array(z.string().uuid()).optional().default([]),
	supportIds: z.array(z.string().uuid()).default([])
});

export type ProgrammeFormData = z.infer<typeof programmeSchema>;
