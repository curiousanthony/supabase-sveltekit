import { env } from '$env/dynamic/private';

/**
 * Verifies that an incoming request carries a valid `Authorization: Bearer <CRON_SECRET>` header.
 * Vercel injects this header automatically for configured cron jobs.
 */
export function verifyCronSecret(request: Request): boolean {
	const secret = env?.CRON_SECRET;
	if (!secret) return false;

	const header = request.headers.get('authorization');
	return header === `Bearer ${secret}`;
}
