import { redirect } from '@sveltejs/kit';

/**
 * Validates and sanitizes a redirect path to prevent open redirect attacks.
 * Only allows same-origin relative paths.
 * @param path - The path to validate
 * @returns A safe relative path, or '/' if validation fails
 */
function validateRedirectPath(path: string): string {
	// Reject protocol-relative URLs (//evil.com) and scheme URLs (https://evil.com)
	// Pattern matches: // at start OR scheme: (e.g., http:, https:, javascript:)
	const maliciousPattern = /^\/\/|^[a-zA-Z][a-zA-Z0-9+.-]*:/;
	if (maliciousPattern.test(path)) {
		console.warn('[Auth Callback] Rejected potentially malicious redirect:', path);
		return '/';
	}

	// Ensure path starts with '/' for relative paths
	if (path.startsWith('/')) {
		return path;
	}

	// If path doesn't start with '/', prepend it
	return `/${path}`;
}

export const GET = async (event) => {
	const {
		url,
		locals: { supabase }
	} = event;
	const code = url.searchParams.get('code') as string;
	const next = url.searchParams.get('next') ?? '/';

	console.log('[Auth Callback] Code received:', code ? 'yes' : 'no');
	console.log('[Auth Callback] Next path:', next);

	if (code) {
		const { error, data } = await supabase.auth.exchangeCodeForSession(code);
		console.log(
			'[Auth Callback] Exchange result - error:',
			error?.message,
			'session:',
			data?.session ? 'yes' : 'no'
		);

		if (!error && data?.session) {
			// Force a session refresh to ensure cookies are set
			// This triggers the storage mechanism to persist the session
			await supabase.auth.getSession();

			// Small delay to ensure async cookie operations complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			// Verify cookies were set by checking what cookies exist
			const allCookies = event.cookies.getAll();
			console.log(
				'[Auth Callback] All cookies after exchange:',
				allCookies
					.map((c) => `${c.name}=${c.value ? c.value.substring(0, 20) + '...' : '(empty)'}`)
					.join(', ')
			);
			const supabaseCookies = allCookies.filter(
				(c) => c.name.includes('supabase') || c.name.includes('sb-')
			);
			console.log(
				'[Auth Callback] Supabase cookies after exchange:',
				supabaseCookies.map((c) => `${c.name} (${c.value ? 'has value' : 'empty'})`).join(', ')
			);

			// Double-check session is available - this should read from the cookies we just set
			const {
				data: { session: verifySession },
				error: sessionError
			} = await supabase.auth.getSession();
			console.log(
				'[Auth Callback] Session verification after exchange:',
				verifySession ? 'found' : 'NOT FOUND',
				'error:',
				sessionError?.message
			);

			if (!verifySession) {
				console.log(
					'[Auth Callback] WARNING: Session not found after exchange, but exchange succeeded. This suggests cookies may not be set correctly.'
				);
				// Still try to redirect - the client might be able to read the cookies
			}

			// The session is in the exchange response, and cookies should be set
			// Validate and sanitize the redirect path to prevent open redirect attacks
			const redirectPath = validateRedirectPath(next);
			console.log('[Auth Callback] Session established, redirecting to:', redirectPath);
			throw redirect(303, redirectPath);
		} else {
			console.log(
				'[Auth Callback] Exchange failed or no session - error:',
				error?.message,
				'redirecting to error page'
			);
			throw redirect(303, '/auth/auth-code-error');
		}
	} else {
		// No code provided, redirect to error page
		throw redirect(303, '/auth/auth-code-error');
	}
};
