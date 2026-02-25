import { z } from 'zod';

/** Only letters (including accented), spaces, hyphens, apostrophes. No numbers or other symbols. */
export const nameRegex = /^[\p{L}\s'-]+$/u;
export const nameErrorMessage =
	'Ne doit contenir que des lettres, espaces, tirets ou apostrophes (pas de chiffres ni caractères spéciaux)';

/** Validates a contact first/last name. Returns error message or null if valid. */
export function validateContactName(
	value: string,
	options?: { requiredMessage?: string }
): string | null {
	const t = value.trim();
	if (!t) return options?.requiredMessage ?? 'Requis';
	if (!nameRegex.test(t)) return nameErrorMessage;
	return null;
}

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
	'Assistant(e) de Direction',
	'Chef de Projet',
	'Responsable des Achats',
	'Consultant',
	'Gérant',
	'Associé',
	'Autre'
] as const;

export const contactSchema = z.object({
	firstName: z
		.string()
		.min(1, 'Le prénom est requis')
		.regex(nameRegex, nameErrorMessage),
	lastName: z
		.string()
		.min(1, 'Le nom est requis')
		.regex(nameRegex, nameErrorMessage),
	email: z.string().email('Email invalide'),
	phone: z.string().optional(),
	poste: z.string().optional(),
	linkedinUrl: z
		.string()
		.url('URL LinkedIn invalide')
		.refine((url) => url.includes('linkedin.com'), {
			message: 'Doit être une URL LinkedIn valide'
		})
		.optional(),
	companyIds: z.array(z.string().uuid()).default([]),
	internalNotes: z.string().optional()
});

export type ContactSchema = z.infer<typeof contactSchema>;
