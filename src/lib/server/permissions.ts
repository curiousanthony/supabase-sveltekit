export type Permission =
	| 'dashboard'
	| 'deals'
	| 'clients'
	| 'formations'
	| 'qualiopi'
	| 'formateurs'
	| 'messagerie'
	| 'workspace_settings'
	| 'bibliotheque';

export const PERMISSIONS: Record<Permission, string[]> = {
	dashboard: ['owner', 'admin', 'sales', 'secretary'],
	deals: ['owner', 'admin', 'sales'],
	clients: ['owner', 'admin', 'sales'],
	formations: ['owner', 'admin', 'secretary'],
	qualiopi: ['owner', 'admin', 'secretary'],
	formateurs: ['owner', 'admin', 'secretary'],
	messagerie: ['owner', 'admin', 'sales', 'secretary'],
	workspace_settings: ['owner', 'admin'],
	bibliotheque: ['owner', 'admin', 'sales', 'secretary']
};

/** Roles that can create/edit/delete Library items (Modules, Programmes). View is allowed by bibliotheque permission. */
export const BIBLIOTHEQUE_MANAGE_ROLES = ['owner', 'admin', 'secretary'];

export function hasPermission(role: string | null, permission: Permission): boolean {
	if (!role) return false;
	return PERMISSIONS[permission].includes(role);
}

export function canManageBibliotheque(role: string | null): boolean {
	if (!role) return false;
	return BIBLIOTHEQUE_MANAGE_ROLES.includes(role);
}
