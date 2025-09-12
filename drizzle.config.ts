import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema/*',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || process.env.VITE_SUPABASE_URL?.replace('/rest/v1', '') + '/db',
  },
  verbose: true,
  strict: true,
});