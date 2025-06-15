'use server';

import { z } from 'zod';
import { createCategory, updateCategoryById } from '@/drizzle/queries/categories';
import { AppError } from '@/lib/appError';
import { revalidatePath } from 'next/cache';
import { categorySchema, categoryUpdateSchema } from '@/components/categories/schema';

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

export async function updateCategoryAction(
  id: number,
  values: z.infer<typeof categoryUpdateSchema>
) {
  const parsed = categoryUpdateSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid data.' };
  }

  // You need to implement updateCategory in your queries
  const result = await updateCategoryById(id, parsed.data.catName, parsed.data.catSlug);
  if (result instanceof AppError) {
    return { error: result.message };
  }

  revalidatePath('/admin/products/categories');
  return { success: true };
}
