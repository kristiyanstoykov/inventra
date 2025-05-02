import { env } from '@/data/env/server';
import { createClient } from 'redis';

export const redisClient = createClient({
  username: env.REDIS_USERNAME,
  password: env.REDIS_TOKEN,
  socket: {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
  },
});
