import { z } from 'zod';

export const companySchema = z.object({
	name: z.string().min(1, 'Le nom est requis'),
	siret: z
		.string()
		.regex(/^\d{14}$/, 'Le SIRET doit contenir exactement 14 chiffres')
		.optional()
		.or(z.literal(''))
		.transform((v) => (v === '' ? undefined : v)),
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
