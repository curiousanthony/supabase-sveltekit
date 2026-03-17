import { z } from 'zod';

export const DEAL_STAGES = [
	'Suspect',
	'Prospect',
	'Négociation',
	'Admin',
	'Signature',
	'Financement',
	'Gagné',
	'Perdu'
] as const;

export type DealStage = (typeof DEAL_STAGES)[number];

export const STAGE_PROBABILITIES: Record<DealStage, number> = {
	Suspect: 10,
	Prospect: 25,
	Négociation: 50,
	Admin: 60,
	Signature: 75,
	Financement: 85,
	Gagné: 100,
	Perdu: 0
};

export const STAGE_COLORS: Record<DealStage, { bg: string; text: string; border: string }> = {
	Suspect: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-600' },
	Prospect: { bg: 'bg-purple-50 dark:bg-purple-950', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
	Négociation: { bg: 'bg-yellow-50 dark:bg-yellow-950', text: 'text-yellow-700 dark:text-yellow-300', border: 'border-yellow-300 dark:border-yellow-700' },
	Admin: { bg: 'bg-blue-50 dark:bg-blue-950', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-300 dark:border-blue-700' },
	Signature: { bg: 'bg-orange-50 dark:bg-orange-950', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700' },
	Financement: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
	Gagné: { bg: 'bg-green-50 dark:bg-green-950', text: 'text-green-700 dark:text-green-300', border: 'border-green-300 dark:border-green-700' },
	Perdu: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-700 dark:text-red-300', border: 'border-red-300 dark:border-red-700' }
};

export const FUNDING_TYPES = [
	'Financement fonds propres (Client)',
	'Financement public (OPCO; CPF...)',
	'Co-financement (OPCO + Client)'
] as const;

export const DEAL_FORMATS = ['Individuel', 'Collectif'] as const;
export const INTRA_INTER = ['Intra', 'Inter'] as const;
export const MODALITIES = ['Distanciel', 'Présentiel', 'Hybride', 'E-Learning'] as const;

export const DEAL_SOURCES = [
	'Site web',
	'Bouche-à-oreille',
	'Salon / Événement',
	'Ancien client',
	'Appel entrant',
	'LinkedIn',
	'Partenaire',
	'Prospecté',
	'Autre'
] as const;

export const LOSS_REASONS = [
	'Prix trop élevé',
	'Concurrent choisi',
	'Report / Pas le bon moment',
	'Budget annulé',
	'Sans réponse',
	'Autre'
] as const;

export const FUNDING_STATUSES = [
	'En attente',
	'Demande envoyée',
	'Accord reçu',
	'Refusé'
] as const;

export const dealSchema = z.object({
	name: z.string().trim().min(1, 'Le nom du deal est requis'),
	stage: z.enum(DEAL_STAGES).default('Suspect'),
	contactId: z.string().uuid().optional().nullable(),
	companyId: z.string().uuid().optional().nullable(),
	programmeId: z.string().uuid().optional().nullable(),
	dealAmount: z.coerce.number().min(0).optional().nullable(),
	fundedAmount: z.coerce.number().min(0).optional().nullable(),
	isFunded: z.boolean().default(false),
	fundingType: z.enum(FUNDING_TYPES).optional().nullable(),
	fundingStatus: z.enum(FUNDING_STATUSES).optional().nullable(),
	fundingReference: z.string().optional().nullable(),
	dealFormat: z.enum(DEAL_FORMATS).optional().nullable(),
	intraInter: z.enum(INTRA_INTER).optional().nullable(),
	modalities: z.array(z.enum(MODALITIES)).default([]),
	desiredStartDate: z.string().optional().nullable(),
	desiredEndDate: z.string().optional().nullable(),
	expectedCloseDate: z.string().optional().nullable(),
	durationHours: z.coerce.number().int().min(0).optional().nullable(),
	nbApprenants: z.coerce.number().int().min(0).optional().nullable(),
	probability: z.coerce.number().int().min(0).max(100).optional().nullable(),
	source: z.enum(DEAL_SOURCES).optional().nullable(),
	lossReason: z.enum(LOSS_REASONS).optional().nullable(),
	lossReasonDetail: z.string().optional().nullable(),
	commercialId: z.string().uuid().optional().nullable(),
	description: z.string().optional().nullable()
});

export type DealSchema = z.infer<typeof dealSchema>;

export function formatCurrency(value: string | number | null | undefined, currency = 'EUR'): string {
	if (value == null) return '—';
	const n = typeof value === 'string' ? Number(value) : value;
	if (Number.isNaN(n)) return '—';
	return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(n);
}

export function userDisplayName(
	user: { firstName?: string | null; lastName?: string | null; email?: string | null } | null | undefined
): string {
	if (!user) return '—';
	const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
	return name || user.email || '—';
}
