import type { LayoutServerLoad } from './$types';
import { canManageBibliotheque } from '$lib/server/permissions';

export const load: LayoutServerLoad = async ({ parent }) => {
	const parentData = await parent();
	const role = parentData?.role ?? null;
	return {
		canManageBibliotheque: canManageBibliotheque(role),
		role
	};
};
