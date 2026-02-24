/**
 * One-off: add phone column to contacts if missing.
 * Run: bun run scripts/add-phone-column.ts
 * Requires DATABASE_URL in .env
 */
import 'dotenv/config';
import postgres from 'postgres';

const url = process.env.DATABASE_URL;
if (!url) {
	console.error('DATABASE_URL is not set');
	process.exit(1);
}

const sql = postgres(url);

try {
	await sql.unsafe('ALTER TABLE "contacts" ADD COLUMN IF NOT EXISTS "phone" text;');
	console.log('Column "phone" added to contacts (or already existed).');
} catch (e) {
	console.error(e);
	process.exit(1);
} finally {
	await sql.end();
}
