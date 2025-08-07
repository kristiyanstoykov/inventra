'use server';

import { z } from 'zod';
import { AppError } from '../appError';
import { userSchema } from '../schema/users';
import { createUser, deleteUser, updateUser } from '@/db/drizzle/queries/users';
import { generateRandomPassword } from '@/auth/core/passwordHasher';

export async function createUserAction(unsafeData: z.infer<typeof userSchema>) {
  const data = userSchema.safeParse(unsafeData);

  const error = {
    error: true,
    message: 'Unimplemented action',
  };

  if (!data.success) {
    return {
      ...error,
      message: 'Invalid attribute data',
    };
  }

  const password = generateRandomPassword();

  const result = await createUser({
    email: data.data.email,
    firstName: data.data.firstName,
    lastName: data.data.lastName,
    companyName: data.data.companyName,
    isCompany: data.data.isCompany,
    bulstat: data.data.bulstat,
    vatNumber: data.data.vatNumber,
    phone: data.data.phone,
    address: data.data.address,
    password: password,
    roleId: data.data.roleId,
  });

  if (result instanceof AppError) {
    return {
      ...error,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: `Successfully created attribute "${data.data.name}"`,
    userId: result,
  };
}

export async function updateUserAction(id: number, unsafeData: z.infer<typeof userSchema>) {
  const data = userSchema.safeParse(unsafeData);

  if (data.error) {
    return {
      error: true,
      message: 'Parsing data failed',
    };
  }

  const result = await updateUser(id, data.data);

  if (result instanceof AppError) {
    return {
      error: true,
      message: result.toString() ?? 'Error updating user.',
    };
  }

  return {
    error: false,
    message: 'User updated successfully',
  };
}

export async function deleteUserAction(id: number) {
  const result = await deleteUser(id);

  if (result instanceof AppError) {
    return result;
  }

  return result;
}
