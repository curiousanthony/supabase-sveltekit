import { redirect } from '@sveltejs/kit'

export const GET = async ({locals: {supabase}}) => {
    await supabase.auth.signOut()
    // return new Response(null, {status: 200})
    throw redirect(307, '/')
}