'use server';

import { z } from 'zod';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { signInSchema, signUpSchema } from './schemas';
import { db } from '@/drizzle/db';
import { UserTable } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';
import { comparePasswords, generateSalt, hashPassword } from '../core/passwordHasher';
import { cookies } from 'next/headers';
import { createUserSession, removeUserFromSession } from '../core/session';
import { empty } from '@/lib/empty';
import { getClientInfo } from '@/lib/getClientInfo';

export async function signIn(unsafeData: z.infer<typeof signInSchema>) {
  const { success, data } = signInSchema.safeParse(unsafeData);

  const { ip, userAgent } = await getClientInfo();

  if (!success) return 'Unable to log you in';

  const user = await db.query.UserTable.findFirst({
    columns: { password: true, salt: true, id: true, email: true, role: true },
    where: eq(UserTable.email, data.email),
  });

  if (user == null || user.password == null || user.salt == null) {
    return 'No account exists for this email or password is wrong.';
  }

  const isCorrectPassword = await comparePasswords({
    hashedPassword: user.password,
    password: data.password,
    salt: user.salt,
  });

  if (!isCorrectPassword) return 'Unable to log you in';

  const sessionUser = {
    id: user.id,
    role: user.role,
  };

  await createUserSession(sessionUser, await cookies(), ip, userAgent);

  redirect('/');
}

export async function signUp(unsafeData: z.infer<typeof signUpSchema>) {
  const { success, data } = signUpSchema.safeParse(unsafeData);
  if (!success) return 'Unable to create account';

  const existingUser = await db.query.UserTable.findFirst({
    where: eq(UserTable.email, data.email),
  });

  if (existingUser != null) return 'Account already exists for this email';

  try {
    const salt = generateSalt();
    const hashedPassword = await hashPassword(data.password, salt);

    const resultId = await db
      .insert(UserTable)
      .values({
        name: data.name,
        email: data.email,
        password: hashedPassword,
        salt,
      })
      .$returningId();

    if (empty(resultId)) {
      throw new Error('Unable to create account');
    }

    const [user] = await db
      .select({
        id: UserTable.id,
        role: UserTable.role,
      })
      .from(UserTable)
      .where(eq(UserTable.id, resultId[0].id));

    if (empty(user)) {
      throw new Error('Unable to create account');
    }

    await createUserSession(user, await cookies());
  } catch (e) {
    return e instanceof Error ? e.message : 'An unknown error occurred';
  }

  redirect('/');
}

export async function logOut() {
  await removeUserFromSession(await cookies());
  redirect('/');
}
