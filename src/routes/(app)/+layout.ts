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

    // 2. Use session and user from server (validated via getUser() in safeGetSession); avoid getSession() here
    const session = data.session ?? null
    const user = data.user ?? null

    // 3. Return the merged data
    return { 
        supabase, 
        session, 
        user, 
        ...data 
    }
}
