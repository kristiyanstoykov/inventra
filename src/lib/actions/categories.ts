'use server';

import { z } from 'zod';
import { AppError } from '../appError';
import {
  createCategory,
  deleteCategory,
  updateCategoryById,
} from '@/db/drizzle/queries/categories';
import { categoryCreateSchema, categoryUpdateSchema } from '../schema/categories';

export async function createCategoryAction(unsafeData: z.infer<typeof categoryCreateSchema>) {
  const data = categoryCreateSchema.safeParse(unsafeData);

  const error = {
    error: true,
    message: 'Unimplemented action',
  };

  if (!data.success) {
    return {
      ...error,
      message: 'Invalid category form data',
    };
  }

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      ...error,
      message: 'Name of category is required',
    };
  }

  const result = await createCategory(data.data.name);

  if (result instanceof AppError) {
    return {
      ...error,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: `Successfully created category "${data.data.name}"`,
  };
}

export async function updateCategoryAction(
  id: number,
  unsafeData: z.infer<typeof categoryUpdateSchema>
) {
  const data = categoryUpdateSchema.safeParse(unsafeData);

  if (!data.success) {
    return {
      error: true,
      message: 'Invalid category form data',
    };
  }

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      error: true,
      message: 'Name of category is required',
    };
  }

  const result = await updateCategoryById(id, data.data.name, data.data.slug);

  if (result instanceof AppError) {
    return {
      error: true,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: 'Successfully updated category',
  };
}

export async function deleteCategoryAction(id: number) {
  return await deleteCategory(id);
}
