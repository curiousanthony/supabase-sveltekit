import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { DATABASE_URL } from '$env/static/private';

const client = postgres(DATABASE_URL!, {
    ssl: 'require',
    max: 10
})
export const db = drizzle(client, { schema });
