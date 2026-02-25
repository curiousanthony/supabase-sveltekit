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
	prixPublic: z.coerce.number().positive('Le prix doit être positif').optional().nullable(),
	statut: z.enum(statutOptions).default('Brouillon'),
	prerequis: z.string().optional().nullable(),
	dureeHeures: z.coerce.number().positive('La durée doit être positive').optional().nullable(),
	moduleIds: z.array(z.string().uuid()).optional().default([])
});

export type ProgrammeFormData = z.infer<typeof programmeSchema>;
