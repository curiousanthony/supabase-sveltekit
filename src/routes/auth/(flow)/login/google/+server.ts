import { redirect } from '@sveltejs/kit'

export const GET = async ({ locals: {supabase}, url }) => {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: url.origin + '/auth/callback',
        },
      })
  
    if (data?.url) {
        // console.log('Redirecting to: ', data.url)
        throw redirect(307,  data.url)
    }
  
    console.log(error)
    throw redirect(307, '/auth/error')
}