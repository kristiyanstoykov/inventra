import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DB_PASSWORD: z.string().min(1),
    DB_USER: z.string().min(1),
    DB_NAME: z.string().min(1),
    DB_HOST: z.string().min(1),
    // DISCORD_CLIENT_ID: z.string().min(1),
    // DISCORD_CLIENT_SECRET: z.string().min(1),
    // OAUTH_REDIRECT_URL_BASE: z.string().url(),
    // GITHUB_CLIENT_ID: z.string().min(1),
    // GITHUB_CLIENT_SECRET: z.string().min(1),
  },
  createFinalSchema: (env: Record<string, z.ZodTypeAny>) => {
    return z.object(env).transform((val) => {
      const { DB_HOST, DB_NAME, DB_PASSWORD, DB_USER, ...rest } = val;

      return {
        ...rest,
        DATABASE_URL: `mysql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}`,
      };
    });
  },
  experimental__runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
