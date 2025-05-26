import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.DB_HOST) {
  throw new Error('DB_HOST is not defined in the environment variables');
}
if (!process.env.DB_USER) {
  throw new Error('DB_USER is not defined in the environment variables');
}
if (!process.env.DB_NAME) {
  throw new Error('DB_NAME is not defined in the environment variables');
}
if (!process.env.DB_PASSWORD) {
  throw new Error('DB_PASSWORD is not defined in the environment variables');
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
});

export const db = drizzle(pool, {
  schema,
  mode: 'default',
});
