#!/usr/bin/env ts-node

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';
import mysql, { Pool, RowDataPacket } from 'mysql2/promise';
import { drizzle, MySql2Database } from 'drizzle-orm/mysql2';
import { eq, inArray } from 'drizzle-orm';

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
    return rows.length > 0;
  } finally {
    await conn.end();
  }
}

async function createDatabase() {
  const conn = await mysql.createConnection({ host: DB_HOST, user: DB_USER, password: DB_PASS });
  try {
    await conn.query(
      `CREATE DATABASE \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
  } finally {
    await conn.end();
  }
}

function runDrizzlePush() {
  const projectRoot = process.cwd();
  const bin = path.join(
    projectRoot,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'drizzle-kit.cmd' : 'drizzle-kit'
  );

  if (!fs.existsSync(bin)) {
    console.error(`❌ drizzle-kit binary not found at: ${bin}`);
    console.error('   Install it:  pnpm add -D drizzle-kit   (or yarn/npm)');
    process.exit(1);
  }

  const run = (args: string[]) =>
    spawnSync(bin, args, {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: { ...process.env, DRIZZLE_KIT_NO_UPDATE_CHECK: '1' },
    }).status ?? 1;

  console.log(`▶ Running drizzle-kit push (new CLI)…`);
  let status = run(['push']); // modern drizzle-kit

  if (status !== 0) {
    console.log('ℹ️ Falling back to legacy command: push:mysql …');
    status = run(['push:mysql']); // older drizzle-kit
  }

  if (status !== 0) {
    console.error(`❌ drizzle-kit push failed.`);
    process.exit(1);
  }
}

type DB = MySql2Database<typeof schema> & { $client: Pool };

async function ensureRoles(db: DB) {
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

const CAPABILITIES: { name: string; description: string }[] = [
  // Products
  { name: 'product.create', description: 'Create products' },
  { name: 'product.read', description: 'Read products' },
  { name: 'product.update', description: 'Update products' },
  { name: 'product.delete', description: 'Delete products' },
  // Warehouses
  { name: 'warehouse.create', description: 'Create warehouses' },
  { name: 'warehouse.read', description: 'Read warehouses' },
  { name: 'warehouse.update', description: 'Update warehouses' },
  { name: 'warehouse.delete', description: 'Delete warehouses' },
  // Users
  { name: 'user.create', description: 'Create users' },
  { name: 'user.read', description: 'Read users' },
  { name: 'user.update', description: 'Update users' },
  { name: 'user.delete', description: 'Delete users' },
  // Orders
  { name: 'order.create', description: 'Create orders' },
  { name: 'order.read', description: 'Read orders' },
  { name: 'order.update', description: 'Update orders' },
  { name: 'order.delete', description: 'Delete orders' },
  // Categories
  { name: 'category.create', description: 'Create categories' },
  { name: 'category.read', description: 'Read categories' },
  { name: 'category.update', description: 'Update categories' },
  { name: 'category.delete', description: 'Delete categories' },
  // Attributes
  { name: 'attribute.create', description: 'Create attributes' },
  { name: 'attribute.read', description: 'Read attributes' },
  { name: 'attribute.update', description: 'Update attributes' },
  { name: 'attribute.delete', description: 'Delete attributes' },
  // Invitees
  { name: 'invitee.create', description: 'Create invitees' },
  { name: 'invitee.read', description: 'Read invitees' },
  { name: 'invitee.update', description: 'Update invitees' },
  { name: 'invitee.delete', description: 'Delete invitees' },
  // Brands
  { name: 'brand.create', description: 'Create brands' },
  { name: 'brand.read', description: 'Read brands' },
  { name: 'brand.update', description: 'Update brands' },
  { name: 'brand.delete', description: 'Delete brands' },
];

async function ensureCapabilitiesAndGrantAllToAdmin(db: DB, adminRoleId: number) {
  const { CapabilityTable, RoleCapabilityTable } = schema;

  // Insert only missing capabilities
  const existingCaps = await db.select().from(CapabilityTable);
  const existingNames = new Set(existingCaps.map((c) => c.name));
  const newCaps = CAPABILITIES.filter((c) => !existingNames.has(c.name));
  if (newCaps.length) await db.insert(CapabilityTable).values(newCaps);

  // Re-read to get IDs for mapping
  const allCaps = await db.select().from(CapabilityTable);
  const relevant = allCaps.filter((c) => CAPABILITIES.some((x) => x.name === c.name));
  const capIds = relevant.map((c) => c.id);

  // Clear admin's role_capabilities then grant all
  await db.delete(RoleCapabilityTable).where(eq(RoleCapabilityTable.roleId, adminRoleId));

  if (capIds.length) {
    await db.insert(RoleCapabilityTable).values(
      capIds.map((capId) => ({ roleId: adminRoleId, capabilityId: capId }))
    );
  }
}

async function adminAlreadyExists(db: DB, adminRoleId: number) {
  const { UserRoleTable } = schema;
  const rows = await db.select().from(UserRoleTable).where(eq(UserRoleTable.roleId, adminRoleId));
  return rows.length > 0;
}

async function promptAndCreateFirstAdmin(db: DB, adminRoleId: number) {
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

  const [existingByEmail] = await db.select().from(UserTable).where(eq(UserTable.email, email));
  if (existingByEmail) {
    console.error('ERROR: A user with this email already exists. Aborting.');
    process.exit(1);
  }

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

  await db.insert(UserRoleTable).values({ userId: user.id, roleId: adminRoleId, warehouseId: null });

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

  const pool = await mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASS,
    database: DB_NAME,
    connectionLimit: 10,
    waitForConnections: true,
  });
  const db = drizzle(pool, { schema, mode: 'default' }) as DB;

  const { adminRoleId } = await ensureRoles(db);

  // Seed capabilities and grant all to admin (always keep admin in sync)
  await ensureCapabilitiesAndGrantAllToAdmin(db, adminRoleId);

  // If an admin already exists, stop (we don't create other users)
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
