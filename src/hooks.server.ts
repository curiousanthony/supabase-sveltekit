import { createServerClient } from '@supabase/ssr'
// import { type Handle, redirect } from '@sveltejs/kit'
import { type Handle } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  /**
   * Creates a Supabase client specific to this server request.
   *
   * The Supabase client gets the Auth token from the request cookies.
   */
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      /**
       * SvelteKit's cookies API requires `path` to be explicitly set in
       * the cookie options. Setting `path` to `/` replicates previous/
       * standard behavior.
       */
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          try {
            // Log cookie setting attempts (especially for auth tokens)
            if (name.includes('auth-token')) {
              console.log('[Hooks] Setting auth cookie:', name, 'has value:', !!value, 'value length:', value?.length || 0)
            }
            event.cookies.set(name, value, { ...options, path: '/' })
          } catch (error) {
            // Ignore errors when trying to set cookies after response has been sent
            // This can happen with async auth state change callbacks
            if (error instanceof Error && error.message.includes('response has been generated')) {
              console.log('[Hooks] Cookie set failed (response sent):', name)
              return
            }
            console.error('[Hooks] Cookie set error:', name, error)
            throw error
          }
        })
      },
    },
  })

  /**
   * Returns session and user. Uses getUser() for the user so the value is
   * validated by the Supabase Auth server (not just from cookies). Session
   * is still read via getSession() for tokens/expiry; do not use session.user.
   */
  event.locals.safeGetSession = async () => {
    const {
      data: { user },
      error: userError,
    } = await event.locals.supabase.auth.getUser()
    if (userError || !user) {
      return { session: null, user: null }
    }

    const {
      data: { session },
    } = await event.locals.supabase.auth.getSession()
    if (!session) {
      return { session: null, user: null }
    }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      /**
       * Supabase libraries use the `content-range` and `x-supabase-api-version`
       * headers, so we need to tell SvelteKit to pass it through.
       */
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

// const authGuard: Handle = async ({ event, resolve }) => {
//   const { session, user } = await event.locals.safeGetSession()
//   event.locals.session = session
//   event.locals.user = user

//   if (!event.locals.session && event.url.pathname.startsWith('/private')) {
//     redirect(303, '/auth')
//   }

//   if (event.locals.session && event.url.pathname === '/auth') {
//     redirect(303, '/private')
//   }

//   return resolve(event)
// }

// export const handle: Handle = sequence(supabase, authGuard)
export const handle: Handle = sequence(supabase)