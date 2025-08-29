#!/usr/bin/env ts-node

import 'dotenv/config';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { eq } from 'drizzle-orm';

// Adjust imports to your paths
import * as schema from '@/db/drizzle/schema';
import { hashPassword, generateSalt } from '@/auth/core/passwordHasher';

const REQ_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'] as const;
for (const k of REQ_ENV) {
  if (!process.env[k]) {
    console.error(`ERROR: Missing ${k} in env`);
    process.exit(1);
  }
}

const DB_HOST = process.env.DB_HOST!;
const DB_USER = process.env.DB_USER!;
const DB_PASS = process.env.DB_PASSWORD!;
const DB_NAME = process.env.DB_NAME!;

async function dbExists(): Promise<boolean> {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    multipleStatements: true,
  });
  try {
    const [rows] = await conn.query<RowDataPacket[]>(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [DB_NAME]
    );
    // rows is RowDataPacket[], so you can safely check length
    return rows.length > 0;
  } finally {
    await conn.end();
  }
}

async function createDatabase() {
  const conn = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
  });
  try {
    await conn.query(
      `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await conn.end();
  }
}

function runDrizzlePush() {
  // Use your package manager; default to npx
  const agent = process.env.npm_config_user_agent || '';
  const cmd = agent.startsWith('pnpm') ? 'pnpm' : agent.startsWith('yarn') ? 'yarn' : 'npx';

  const args = ['drizzle-kit', 'push:mysql'];

  console.log('▶ Applying schema with drizzle-kit push…');
  const res = spawnSync(cmd, args, { stdio: 'inherit', env: process.env });
  if (res.status !== 0) {
    console.error('ERROR: drizzle-kit push failed');
    process.exit(res.status ?? 1);
  }
}

async function ensureRoles(db: MySql2Database<typeof schema> & { $client: Pool }) {
  const { RoleTable } = schema;
  const needed = ['admin', 'client'] as const;

  const existing = await db.select().from(RoleTable);
  const have = new Set(existing.map((r) => r.name));
  const toInsert = needed.filter((n) => !have.has(n)).map((name) => ({ name }));
  if (toInsert.length) await db.insert(RoleTable).values(toInsert);

  const roles = await db.select().from(RoleTable);
  const adminRole = roles.find((r) => r.name === 'admin');
  const clientRole = roles.find((r) => r.name === 'client');
  if (!adminRole || !clientRole) throw new Error('Roles missing after insert');

  return { adminRoleId: adminRole.id };
}

async function adminAlreadyExists(
  db: MySql2Database<typeof schema> & { $client: Pool },
  adminRoleId: number
) {
  const { UserRoleTable } = schema;
  const rows = await db.select().from(UserRoleTable).where(eq(UserRoleTable.roleId, adminRoleId));
  return rows.length > 0;
}

async function promptAndCreateFirstAdmin(
  db: MySql2Database<typeof schema> & { $client: Pool },
  adminRoleId: number
) {
  const { UserTable, UserRoleTable } = schema;

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  console.log('\n— Create FIRST admin user —');
  const email = (await rl.question('Email: ')).trim();
  const firstName = (await rl.question('First name: ')).trim();
  const lastName = (await rl.question('Last name: ')).trim();
  const password = (await rl.question('Password: ')).trim();
  rl.close();

  if (!email || !password) {
    console.error('ERROR: Email and password are required.');
    process.exit(1);
  }

  // Create user
  const salt = generateSalt();
  const passHash = await hashPassword(password, salt);

  await db.insert(UserTable).values({
    email,
    firstName: firstName || null,
    lastName: lastName || null,
    salt,
    password: passHash,
    isCompany: false,
  });

  const [user] = await db.select().from(UserTable).where(eq(UserTable.email, email));
  if (!user) throw new Error('Failed to read back created admin user');

  await db.insert(UserRoleTable).values({
    userId: user.id,
    roleId: adminRoleId,
    warehouseId: null,
  });

  console.log('✅ Admin user created and mapped to role.');
}

async function main() {
  console.log(`🔎 Checking database "${DB_NAME}"…`);
  if (await dbExists()) {
    console.error(`⛔ Database "${DB_NAME}" already exists. Aborting.`);
    process.exit(2);
  }

  console.log('🛠  Creating database…');
  await createDatabase();
  console.log('✅ Database created.');

  runDrizzlePush();
  console.log('✅ Schema applied.');

  // Connect to the new DB
  const pool = await mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
  });
  const db = drizzle(pool, { schema, mode: 'default' });

  // Seed roles only
  const { adminRoleId } = await ensureRoles(db);

  // If any admin exists, stop (we don't create other users)
  if (await adminAlreadyExists(db, adminRoleId)) {
    console.log('ℹ️ Admin already exists. No users will be created. Exiting.');
    await pool.end();
    process.exit(0);
  }

  // Prompt & create the FIRST admin only
  await promptAndCreateFirstAdmin(db, adminRoleId);

  await pool.end();
  console.log('\n🎉 Done.');
}

main().catch((e) => {
  console.error('ERROR: Failed:', e);
  process.exit(1);
});
