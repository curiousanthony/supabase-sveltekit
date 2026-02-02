export type WorkspaceRole = 'owner' | 'admin' | 'sales' | 'secretary';

export const ROLE_LABELS: Record<WorkspaceRole, string> = {
	owner: 'Directeur',
	admin: 'Gestionnaire',
	sales: 'Commercial',
	secretary: 'Coordinateur administratif'
};

export function getRoleLabel(role: WorkspaceRole): string {
	return ROLE_LABELS[role] ?? role;
}
