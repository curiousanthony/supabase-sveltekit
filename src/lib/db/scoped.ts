import { sql } from 'drizzle-orm';
import { db } from './index';

/**
 * Runs a callback inside a transaction with the user's auth context set.
 * This makes auth.uid() available for RLS policies when using a connection
 * that enforces RLS (e.g. Supabase pooler in session mode with JWT).
 *
 * When using the default postgres superuser connection, RLS is bypassed;
 * this helper is for future use when switching to an RLS-enforcing connection.
 */
export async function withUserScope<T>(
	userId: string,
	callback: (tx: typeof db) => Promise<T>
): Promise<T> {
	const claims = JSON.stringify({ sub: userId });
	return db.transaction(async (tx) => {
		try {
			await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', ${userId}, true)`);
			await tx.execute(sql`SELECT set_config('request.jwt.claims', ${claims}, true)`);
			return await callback(tx as typeof db);
		} finally {
			await tx.execute(sql`SELECT set_config('request.jwt.claim.sub', NULL, true)`);
			await tx.execute(sql`SELECT set_config('request.jwt.claims', NULL, true)`);
		}
	});
}
