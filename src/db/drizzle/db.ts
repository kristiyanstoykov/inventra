import { drizzle } from 'drizzle-orm/mysql2';
import mysql, { Pool } from 'mysql2/promise';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

for (const k of ['DB_HOST', 'DB_USER', 'DB_NAME', 'DB_PASSWORD'] as const) {
  if (!process.env[k]) throw new Error(`${k} is not defined`);
}

// Augment global for dev hot-reload (Node)
declare global {
  var __drizzle_pool__: Pool | undefined;
  var __drizzle_db__: ReturnType<typeof drizzle> | undefined;
}

// Reuse pool
const pool =
  global.__drizzle_pool__ ??
  mysql.createPool({
    host: process.env.DB_HOST!,
    user: process.env.DB_USER!,
    database: process.env.DB_NAME!,
    password: process.env.DB_PASSWORD!,
    // Important: prevent connection storms
    connectionLimit: 10, // tune to your workload
    waitForConnections: true, // queue instead of throwing
    queueLimit: 0, // unlimited queue (or set a cap)
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
  });

// Reuse drizzle
const _db =
  global.__drizzle_db__ ??
  drizzle(pool, {
    schema,
    mode: 'default',
  });

if (process.env.NODE_ENV !== 'production') {
  global.__drizzle_pool__ = pool;
  global.__drizzle_db__ = _db;
}

export const db = _db;

// (optional) graceful shutdown in scripts, not needed in Next.js usually
process.on('SIGINT', async () => {
  try {
    await pool.end();
  } finally {
    process.exit(0);
  }
});
