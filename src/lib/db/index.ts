import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import * as relations from './relations'
import { DATABASE_URL } from '$env/static/private';

const client = postgres(DATABASE_URL!);
// export const db = drizzle(client, { schema });

export const db = drizzle(client, {
    schema: { ...schema, ...relations } // Merge all
  });
