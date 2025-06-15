'use server';

import { z } from 'zod';
import { AppError } from '@/lib/appError';
import { revalidatePath } from 'next/cache';
import { attributeSchema } from '@/components/attributes/schema';
import { createAttribute, updateAttributeById } from '@/drizzle/queries/attributes';

export async function createAttributeAction(values: z.infer<typeof attributeSchema>) {
  const parsed = attributeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid data.' };
  }

  const result = await createAttribute(parsed.data.name, parsed.data.value, parsed.data.unit);
  if (result instanceof AppError) {
    return { error: result.message };
  }

  revalidatePath('/admin/products/categories');
  return { success: true };
}

export async function updateAttributeAction(id: number, values: z.infer<typeof attributeSchema>) {
  const parsed = attributeSchema.safeParse(values);
  if (!parsed.success) {
    return { error: 'Invalid data.' };
  }

  // You need to implement updateCategory in your queries
  const result = await updateAttributeById(
    id,
    parsed.data.name,
    parsed.data.value,
    parsed.data.unit
  );
  if (result instanceof AppError) {
    return { error: result.message };
  }

  revalidatePath('/admin/products/categories');
  return { success: true };
}
