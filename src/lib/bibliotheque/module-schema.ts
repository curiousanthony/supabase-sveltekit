import { z } from 'zod';

export const modaliteEvaluationOptions = ['QCM', 'QCU', 'Pratique', 'Projet'] as const;

export const moduleSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	contenu: z.string().optional(),
	objectifsPedagogiques: z.string().optional(),
	modaliteEvaluation: z.enum(modaliteEvaluationOptions).optional().nullable(),
	dureeHeures: z.union([
		z.undefined(),
		z.null(),
		z.coerce
			.number()
			.refine((v) => !Number.isNaN(v), {
				message: 'La durée doit être un nombre valide'
			})
			.positive('La durée doit être positive')
	])
});

export type ModuleFormData = z.infer<typeof moduleSchema>;
