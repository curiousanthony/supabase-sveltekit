import type { WorkspaceRole } from './workspace';

export type Permission =
	| 'dashboard'
	| 'deals'
	| 'clients'
	| 'formations'
	| 'qualiopi'
	| 'formateurs'
	| 'messagerie'
	| 'workspace_settings';

/**
 * Maps each permission to the roles that can access it.
 */
export const PERMISSIONS: Record<Permission, WorkspaceRole[]> = {
	dashboard: ['owner', 'admin', 'sales', 'secretary'],
	deals: ['owner', 'admin', 'sales'],
	clients: ['owner', 'admin', 'sales'],
	formations: ['owner', 'admin', 'secretary'],
	qualiopi: ['owner', 'admin', 'secretary'],
	formateurs: ['owner', 'admin', 'secretary'],
	messagerie: ['owner', 'admin', 'sales', 'secretary'],
	workspace_settings: ['owner', 'admin']
};

export function hasPermission(role: WorkspaceRole | null, permission: Permission): boolean {
	if (!role) return false;
	return PERMISSIONS[permission].includes(role);
}
