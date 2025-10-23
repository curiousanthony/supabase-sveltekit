import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
    // This prevents logged-in users from seeing the sign-in/sign-up forms.
    
    // Attempt to get the authenticated session
    const { session } = await locals.safeGetSession();


    // If the user IS authenticated, redirect them to the root dashboard
    if (session) {
        throw redirect(303, '/');
    }

    // If not authenticated, allow them to proceed to the login/signup page
    return {};
};
