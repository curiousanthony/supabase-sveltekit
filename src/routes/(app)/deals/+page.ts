import type { PageLoad } from './$types';

/** Pass-through: all data comes from +page.server.ts */
export const load = (async ({ data }) => data) satisfies PageLoad;
