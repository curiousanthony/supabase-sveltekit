export type ComplianceLevel = 'amber' | 'red';

export interface ComplianceWarning {
	level: ComplianceLevel;
	message: string;
	documentType: string;
}

interface DocumentStatusInput {
	type: string;
	effectiveStatus: string;
}

const COMPLIANCE_RULES: {
	documentType: string;
	label: string;
	requiredStatus: string[];
	amberDays: number;
}[] = [
	{
		documentType: 'convention',
		label: 'Convention non signée',
		requiredStatus: ['signe', 'archive'],
		amberDays: 3
	},
	{
		documentType: 'devis',
		label: 'Devis non accepté',
		requiredStatus: ['accepte', 'archive'],
		amberDays: 5
	}
];

export function getComplianceWarnings(
	documents: DocumentStatusInput[],
	dateDebut: string | null | undefined
): ComplianceWarning[] {
	if (!dateDebut) return [];

	const startDate = new Date(dateDebut);
	const now = new Date();
	const diffMs = startDate.getTime() - now.getTime();
	const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

	const warnings: ComplianceWarning[] = [];

	for (const rule of COMPLIANCE_RULES) {
		const docsOfType = documents.filter(
			(d) => d.type === rule.documentType && d.effectiveStatus !== 'remplace'
		);

		if (docsOfType.length === 0) continue;

		const hasCompliant = docsOfType.some((d) => rule.requiredStatus.includes(d.effectiveStatus));
		if (hasCompliant) continue;

		if (diffDays <= 0) {
			warnings.push({
				level: 'red',
				message: `${rule.label}, formation commencée`,
				documentType: rule.documentType
			});
		} else if (diffDays <= rule.amberDays) {
			warnings.push({
				level: 'amber',
				message: `${rule.label}, formation dans ${diffDays} jour${diffDays > 1 ? 's' : ''}`,
				documentType: rule.documentType
			});
		}
	}

	return warnings;
}
