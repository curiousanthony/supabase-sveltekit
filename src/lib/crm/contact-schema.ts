import { z } from 'zod';

export const posteOptions = [
	'PDG / Président',
	'Directeur Général',
	'Directeur des Ressources Humaines',
	'Responsable RH',
	'Responsable Formation',
	'Directeur Commercial',
	'Responsable Commercial',
	'Directeur Marketing',
	'Directeur Financier',
	'Directeur des Opérations',
	'Directeur Technique',
	'Office Manager',
	'Assistante de Direction',
	'Chef de Projet',
	'Responsable des Achats',
	'Consultant',
	'Gérant',
	'Associé',
	'CEO',
	'Autre'
] as const;

export const contactSchema = z.object({
	firstName: z.string().min(1, 'Le prénom est requis'),
	lastName: z.string().min(1, 'Le nom est requis'),
	email: z.string().email('Email invalide'),
	phone: z.string().optional(),
	poste: z.string().optional(),
	linkedinUrl: z.string().optional(),
	companyIds: z.array(z.string().uuid()).default([]),
	internalNotes: z.string().optional()
});

export type ContactSchema = z.infer<typeof contactSchema>;
