import type { LayoutLoad } from './$types'; 
import { createBrowserClient } from '@supabase/ssr';
// Assume $env imports are correctly configured
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';

/**
 * Global Load Function (Public Context)
 * Provides the bare minimum required by the root +layout.svelte to run the global auth listener.
 * This is client-side only and will be OVERRIDDEN by the (app) group's server load during SSR.
 */
export const load: LayoutLoad = async ({ fetch }) => {
    // 1. Create the browser client only
    const supabase = createBrowserClient(
        PUBLIC_SUPABASE_URL,
        PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        {
            global: { fetch },
        }
    );

    // 2. Get the current session (will be null if unauthenticated)
    const { data: { session } } = await supabase.auth.getSession();

    return {
        // Return the client instance and session to prevent the root layout from crashing
        supabase,
        session: session,
    };
};
