'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { userSchema } from '@/components/users/schema';
import { AppError } from '@/lib/appError';

// Dummy action, replace with your actual action
export async function createUserAction(values: z.infer<typeof userSchema>) {
  const result = new AppError('This action is not implemented yet.', 'context');
  console.log(result);
  if (result instanceof AppError) {
    return { error: result.toString() };
  }
  // API call here
  revalidatePath('/admin/users');
  return { success: false };
}
