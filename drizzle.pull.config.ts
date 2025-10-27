import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  // schema: "./db/migrations/schema.ts",
  out: "./src/lib/db",
  dbCredentials: {
    url: process.env.DATABASE_URL!
  }
  // dbCredentials: {
  //   host: "localhost",
  //   port: 54321,
  //   user: "postgres",
  //   password: "postgres",
  //   database: "supabase",
  // }
});
