import { redirect } from '@sveltejs/kit'

export const GET = async ({ locals: {supabase}, url }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "github",
        options: {
          redirectTo: url.origin + '/auth/callback',
        },
      })
  
    if (error) {
        throw redirect(307,  '/auth/error')
    }
  
    if (data?.url) {
        throw redirect(307,  data.url)
    }
    throw redirect(307, '/auth/error')
}