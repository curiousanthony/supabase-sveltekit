import { redirect } from '@sveltejs/kit'


export const GET = async ({ locals: {supabase}, url }) => {

    const redirectTo = url.searchParams.get('redirectTo') || '/';
    console.log('redirectTo: ', redirectTo)

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: url.origin + `/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
  
    if (data?.url) {
        // console.log('Redirecting to: ', data.url)
        throw redirect(307,  data.url)
    }
  
    console.log(error)
    throw redirect(307, '/auth/error')
}