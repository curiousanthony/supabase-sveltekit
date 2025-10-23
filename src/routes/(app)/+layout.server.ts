import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from '../$types';

// Assuming you've set up your Supabase client and session in hooks.server.ts
// which makes event.locals.safeGetSession() available.

export const load: LayoutServerLoad = async ({ locals, url }) => {
    // Attempt to get the authenticated session from the server locals
    const { session } = await locals.safeGetSession();

    // If the user is NOT authenticated, redirect them to the login page
    if (!session) {
        // Use a 303 redirect and pass the current URL as a query parameter
        // so the user can be returned here after successful login.
        throw redirect(303, `/auth/login?redirectTo=${url.pathname}`);
    }

    // If authenticated, the layout and pages can load and access the session data
    return {
        session,
        // (Optional: return other data needed by the entire protected group)
    };
};