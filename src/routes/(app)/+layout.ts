import { createBrowserClient, createServerClient, isBrowser } from '@supabase/ssr'
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public'
import type { LayoutLoad } from './$types'

/**
 * Universal Load Function (Protected Context)
 * This is the crucial layer that merges server data ({session, cookies}) with child data ({pageName}).
 */
export const load: LayoutLoad = async ({ data, depends, fetch }) => {
    // Declares dependency to force refresh on auth change
    depends('supabase:auth')

    // 1. Initialize the full Supabase client (SSR-aware)
    const supabase = isBrowser()
        ? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
            global: { fetch },
        })
        : createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
            global: { fetch },
            cookies: {
                // Safely access data.cookies (forwarded from +layout.server.ts)
                getAll() {
                    return data.cookies ?? [] 
                },
            },
        })

    // 2. Get session and user data from the robust client
    const { data: { session } } = await supabase.auth.getSession()
    const { data: { user } } = await supabase.auth.getUser()

    // 3. Return the merged data
    return { 
        supabase, 
        session, 
        user, 
        // CRITICAL FIX: Forward all data from the child page (which includes pageName)
        ...data 
    }
}
