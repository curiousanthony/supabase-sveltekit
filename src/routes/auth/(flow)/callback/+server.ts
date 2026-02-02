import { redirect } from '@sveltejs/kit';
import { getUserWorkspace } from '$lib/auth';

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

	if (code) {
		const { error, data } = await supabase.auth.exchangeCodeForSession(code);

		if (!error && data?.session) {
			// Validate user via Auth server so cookies/session are fully established
			const {
				data: { user },
				error: userError
			} = await supabase.auth.getUser();

			// Small delay to ensure async cookie operations complete
			await new Promise((resolve) => setTimeout(resolve, 10));

			if (userError || !user) {
				throw redirect(303, '/auth/auth-code-error');
			}

			// Ensure user has a workspace (create if missing) so first app load only does reads
			try {
				await getUserWorkspace(event.locals);
			} catch (err) {
				console.error('[Auth Callback] Workspace provisioning failed:', err);
				// Redirect anyway; layout/page will retry getUserWorkspace on first load
			}

			// Validate and sanitize the redirect path to prevent open redirect attacks
			const redirectPath = validateRedirectPath(next);
			throw redirect(303, redirectPath);
		} else {
			throw redirect(303, '/auth/auth-code-error');
		}
	} else {
		// No code provided, redirect to error page
		throw redirect(303, '/auth/auth-code-error');
	}
};
