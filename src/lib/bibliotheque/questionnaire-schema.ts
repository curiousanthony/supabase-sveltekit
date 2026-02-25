import { z } from 'zod';

export const typeQuestionnaireOptions = [
	'Test de niveau',
	'Quiz / Exercice',
	'Audit des besoins'
] as const;

export const questionnaireSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	type: z.enum(typeQuestionnaireOptions).optional().nullable(),
	urlTest: z.string().url('URL invalide').optional().or(z.literal('')).nullable(),
	programmeIds: z.array(z.string().uuid()).optional().default([]),
	moduleIds: z.array(z.string().uuid()).optional().default([])
});

export type QuestionnaireFormData = z.infer<typeof questionnaireSchema>;
