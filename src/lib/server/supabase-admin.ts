import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/private';
import { config as loadDotenv } from 'dotenv';

const BUCKET_ID = 'workspace-logos';

// In dev, Vite/SvelteKit may not inject .env into $env/dynamic/private or process.env.
// Load .env into process.env when running in Node so the admin client can find the key.
if (typeof process !== 'undefined') {
	loadDotenv();
}

export type SupabaseAdminClient = ReturnType<typeof createClient>;

/**
 * Returns a Supabase client with the service role key when SUPABASE_SERVICE_ROLE_KEY is set.
 * Use this for server-side storage operations (e.g. workspace logo upload) so uploads work
 * regardless of Storage RLS. The app still validates user permission before calling storage.
 * Reads from $env/dynamic/private, then process.env (dotenv loads .env into process.env as fallback).
 */
export function getSupabaseAdmin(): SupabaseAdminClient | null {
	const url =
		env?.PUBLIC_SUPABASE_URL ??
		(typeof process !== 'undefined' && process.env?.PUBLIC_SUPABASE_URL);
	const serviceRoleKey =
		env?.SUPABASE_SERVICE_ROLE_KEY ??
		(typeof process !== 'undefined' && process.env?.SUPABASE_SERVICE_ROLE_KEY);
	if (!url || !serviceRoleKey) return null;
	return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export function getWorkspaceLogosBucketId(): string {
	return BUCKET_ID;
}

/**
 * Ensures the workspace-logos bucket exists. Call this before upload when using the admin client.
 * Creates the bucket with public read if it does not exist.
 */
export async function ensureWorkspaceLogosBucket(admin: SupabaseAdminClient): Promise<void> {
	const { data: buckets } = await admin.storage.listBuckets();
	const exists = buckets?.some(
		(b: { id?: string; name?: string }) => b.id === BUCKET_ID || b.name === BUCKET_ID
	);
	if (exists) return;
	const { error } = await admin.storage.createBucket(BUCKET_ID, {
		public: true,
		fileSizeLimit: 5242880, // 5MB
		allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
	});
	if (error) {
		// Bucket might already exist (race or created elsewhere)
		if (
			error.message?.toLowerCase().includes('already exists') ||
			error.message?.toLowerCase().includes('duplicate')
		)
			return;
		console.error('[Supabase Admin] createBucket error:', error);
		throw error;
	}
}
