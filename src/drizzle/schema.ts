import { sql } from 'drizzle-orm';
import { mysqlTable, datetime, mysqlEnum, int, text, varchar } from 'drizzle-orm/mysql-core';

export const userRoles = ['admin', 'user'] as const;
export type UserRole = (typeof userRoles)[number];
export function userRoleEnum() {
  return mysqlEnum('user_roles', userRoles);
}

export const UserTable = mysqlTable('users', {
  id: int('id').autoincrement().primaryKey().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  password: text('password'),
  salt: text('salt'),
  role: userRoleEnum().notNull().default('user'),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`)
    .$onUpdateFn(() => sql`CURRENT_TIMESTAMP`),
});

export const SessionTable = mysqlTable('sessions', {
  id: int('id').autoincrement().primaryKey().notNull(),
  tokenHash: varchar('token_hash', { length: 512 }).notNull(), // Hash of the session token.
  userId: int('user_id')
    .notNull()
    .references(() => UserTable.id),
  role: userRoleEnum().notNull().default('user'),
  ip: varchar('ip', { length: 64 }), // IPv6-safe.
  userAgent: text('user_agent'),
  expiresAt: datetime('expires_at').notNull(),
  createdAt: datetime('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
});

export const schema = {
  users: UserTable,
  sessions: SessionTable,
};
