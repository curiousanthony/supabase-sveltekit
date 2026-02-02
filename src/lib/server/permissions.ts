export type Permission =
	| 'dashboard'
	| 'deals'
	| 'clients'
	| 'formations'
	| 'qualiopi'
	| 'formateurs'
	| 'messagerie'
	| 'workspace_settings';

export const PERMISSIONS: Record<Permission, string[]> = {
	dashboard: ['owner', 'admin', 'sales', 'secretary'],
	deals: ['owner', 'admin', 'sales'],
	clients: ['owner', 'admin', 'sales'],
	formations: ['owner', 'admin', 'secretary'],
	qualiopi: ['owner', 'admin', 'secretary'],
	formateurs: ['owner', 'admin', 'secretary'],
	messagerie: ['owner', 'admin', 'sales', 'secretary'],
	workspace_settings: ['owner', 'admin']
};

export function hasPermission(role: string | null, permission: Permission): boolean {
	if (!role) return false;
	return PERMISSIONS[permission].includes(role);
}
