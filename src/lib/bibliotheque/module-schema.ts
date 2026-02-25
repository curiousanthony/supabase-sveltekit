import { z } from 'zod';

export const modaliteEvaluationOptions = ['QCM', 'QCU', 'Pratique', 'Projet'] as const;

export const moduleSchema = z.object({
	titre: z.string().min(1, 'Le titre est requis'),
	contenu: z.string().optional(),
	objectifsPedagogiques: z.string().optional(),
	modaliteEvaluation: z.enum(modaliteEvaluationOptions).optional().nullable(),
	dureeHeures: z.coerce.number().positive('La durée doit être positive').optional().nullable()
});

export type ModuleFormData = z.infer<typeof moduleSchema>;
