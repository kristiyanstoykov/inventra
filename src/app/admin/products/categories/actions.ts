'use server';

import { z } from 'zod';
import { createCategory } from '@/drizzle/queries/categories';
import { AppError } from '@/lib/appError';
import { revalidatePath } from 'next/cache';
import { categorySchema } from './components/schema';

export async function createCategoryAction(values: z.infer<typeof categorySchema>) {
  const parsed = categorySchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid data.' };
  }

  const result = await createCategory(parsed.data.catName);
  if (result instanceof AppError) {
    return { error: result.message };
  }

  revalidatePath('/admin/products/categories');
  return { success: true };
}
