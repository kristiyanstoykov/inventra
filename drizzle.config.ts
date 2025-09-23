import { env } from '@/data/env/server';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './src/db/drizzle/migrations',
  schema: './src/db/drizzle/schema.ts',
  dialect: 'mysql',
  strict: true,
  verbose: true,
  dbCredentials: {
    url: env.DATABASE_URL,
  },
});
