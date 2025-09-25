'use server';

import { z } from 'zod';
import { AppError } from '../appError';
import { userSchema } from '../schema/users';
import {
  createUser,
  deleteUser,
  getPaginatedUsers,
  getUserByBulstat,
  getUserByEmailAuth,
  getUserById,
  getUserByPhone,
  getUserByVATNumber,
  getUsersByName,
  updateUser,
} from '@/db/drizzle/queries/users';
import { generateRandomPassword } from '@/auth/core/passwordHasher';
import { empty } from '../empty';

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

  const existingUserByEmail = await getUserByEmailAuth(data.data.email);
  if ( ! empty(existingUserByEmail) ) {
    return {
      error: true,
      message: `There is an existing user with email "${data.data.email}"`,
      userId: existingUserByEmail.id,
    };
  }

  const existingUserByPhone = await getUserByPhone(data.data.phone);
  if ( ! empty(existingUserByPhone) ) {
    return {
      error: true,
      message: `There is an existing user with phone "${data.data.phone}"`,
      userId: existingUserByPhone.id,
    };
  }

  if ( ! empty(data.data.bulstat) ) {
    const existingUserByBulstat = await getUserByBulstat(data.data.bulstat);
    if ( ! empty(existingUserByBulstat) ) {
      return {
        error: true,
        message: `There is an existing user with bulstat "${data.data.bulstat}"`,
        userId: existingUserByBulstat.id,
      };
    }
  }

  if ( ! empty(data.data.vatNumber) ) {
    const existingUserByVATNumber = await getUserByVATNumber(data.data.vatNumber);
    if ( ! empty(existingUserByVATNumber) ) {
      return {
        error: true,
        message: `There is an existing user with vat number "${data.data.vatNumber}"`,
        userId: existingUserByVATNumber.id,
      };
    }
  }

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

export async function getUsersByNameAction(name: string) {
  if (!name || name.length < 3) {
    return [];
  }

  const users = await getUsersByName(name);

  if (users instanceof AppError) {
    return [];
  }

  return users.map((user) => ({
    id: user.id,
    name: `${user.name}`,
  }));
}

export async function getUsersBySearch( search: string ){

  const users = await getPaginatedUsers(undefined, undefined, undefined, undefined, search);

  if (users instanceof AppError) {
    return [];
  }

  return users.data.map((user) => ({
    id: user.id,
    name: `${user.firstName} ${user.lastName}`.trim(),
  }));
}

export async function getUserByIdAction(id: number) {
  if (!id) {
    return null;
  }

  const user = await getUserById(id);

  if (user instanceof AppError) {
    return null;
  }

  return {
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    firstName: user.firstName || '',
    lastName: user.lastName || '',
  };
}
