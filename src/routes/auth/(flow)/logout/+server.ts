import { redirect } from '@sveltejs/kit';

export const GET = async ({ locals: { supabase }, cookies }) => {
	await supabase.auth.signOut();
	// Clear "See as" cookie on logout
	cookies.set('see_as', '', { path: '/', maxAge: 0 });
	// return new Response(null, {status: 200})
	throw redirect(307, '/');
};
