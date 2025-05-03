import { eq } from 'drizzle-orm';
import { db } from '@/drizzle/db';
import { SessionTable } from '@/drizzle/schema';
import { userRoles } from '@/drizzle/schema';
import { z } from 'zod';
import crypto from 'crypto';

const SESSION_EXPIRATION_SECONDS = 60 * 60 * 24 * 7;
const COOKIE_SESSION_KEY = 'session-id';

const sessionSchema = z.object({
  id: z.number(),
  role: z.enum(userRoles),
});

type UserSession = z.infer<typeof sessionSchema>;

export type Cookies = {
  set: (
    key: string,
    value: string,
    options: {
      secure?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax';
      expires?: number;
    }
  ) => void;
  get: (key: string) => { name: string; value: string } | undefined;
  delete: (key: string) => void;
};

export async function getUserFromSession(cookies: Pick<Cookies, 'get'>) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return null;

  const session = await getSessionByToken(sessionToken);
  if (!session || new Date(session.expiresAt) < new Date()) {
    return null;
  }

  return {
    id: session.userId,
    role: session.role,
  } satisfies UserSession;
}

export async function createUserSession(
  user: UserSession,
  cookies: Pick<Cookies, 'set'>,
  ip: string | null = null,
  userAgent: string | null = null
) {
  const sessionToken = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_EXPIRATION_SECONDS * 1000);

  await db.insert(SessionTable).values({
    tokenHash: sessionToken,
    userId: user.id,
    role: user.role,
    expiresAt,
    ip,
    userAgent,
  });

  setCookie(sessionToken, cookies);
}

export async function updateUserSessionData(user: UserSession, cookies: Pick<Cookies, 'get'>) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return;

  const session = await getSessionByToken(sessionToken);
  if (!session) return;

  await db.update(SessionTable).set({ role: user.role }).where(eq(SessionTable.id, session.id));
}

export async function updateUserSessionExpiration(cookies: Pick<Cookies, 'get' | 'set'>) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return;

  const session = await getSessionByToken(sessionToken);
  if (!session || new Date(session.expiresAt) < new Date()) return;

  const newExpires = new Date(Date.now() + SESSION_EXPIRATION_SECONDS * 1000);

  await db
    .update(SessionTable)
    .set({ expiresAt: newExpires })
    .where(eq(SessionTable.tokenHash, sessionToken));

  setCookie(sessionToken, cookies);
}

export async function removeUserFromSession(cookies: Pick<Cookies, 'get' | 'delete'>) {
  const sessionToken = cookies.get(COOKIE_SESSION_KEY)?.value;
  if (!sessionToken) return;

  await db.delete(SessionTable).where(eq(SessionTable.tokenHash, sessionToken));
  cookies.delete(COOKIE_SESSION_KEY);
}

function setCookie(token: string, cookies: Pick<Cookies, 'set'>) {
  cookies.set(COOKIE_SESSION_KEY, token, {
    secure: true,
    httpOnly: true,
    sameSite: 'lax',
    expires: Date.now() + SESSION_EXPIRATION_SECONDS * 1000,
  });
}

async function getSessionByToken(token: string) {
  const result = await db
    .select()
    .from(SessionTable)
    .where(eq(SessionTable.tokenHash, token))
    .limit(1);

  return result[0] ?? null;
}
