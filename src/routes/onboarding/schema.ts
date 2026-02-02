import { z } from 'zod';

export const onboardingSchema = z.object({
	workspaceName: z
		.string()
		.min(2, 'Le nom doit contenir au moins 2 caractères')
		.max(100, 'Le nom ne peut pas dépasser 100 caractères')
});

export type OnboardingSchema = z.infer<typeof onboardingSchema>;
