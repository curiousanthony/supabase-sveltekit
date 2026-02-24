import { z } from 'zod';

export const legalStatusOptions = ['Indépendant', 'Entreprise'] as const;
export const industryOptions = ['Éducation et formation', 'Restauration', 'Autre'] as const;
export const companySizeOptions = ['0 - Solo', '1-10 - TPE', '11-49 - PME', '50-249', '250+'] as const;

export const companySchema = z.object({
	name: z.string().min(1, 'Le nom est requis'),
	siret: z.string().optional(),
	legalStatus: z.string().optional(),
	industry: z.string().optional(),
	companySize: z.string().optional(),
	websiteUrl: z.string().optional(),
	address: z.string().optional(),
	city: z.string().optional(),
	region: z.string().optional(),
	internalNotes: z.string().optional()
});

export type CompanySchema = z.infer<typeof companySchema>;
