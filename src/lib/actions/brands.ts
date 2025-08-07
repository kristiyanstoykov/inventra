'use server';

import { z } from 'zod';
import { AppError } from '../appError';
import { brandSchema } from '../schema/brand';
import { createBrand, deleteBrand } from '@/db/drizzle/queries/brands';

export async function createBrandAction(unsafeData: z.infer<typeof brandSchema>) {
  const data = brandSchema.safeParse(unsafeData);

  const error = {
    error: true,
    message: 'Unimplemented action',
  };

  if (!data.success) {
    return {
      ...error,
      message: 'Invalid brand data',
    };
  }

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      ...error,
      message: 'Name of brand is required',
    };
  }

  const result = await createBrand(data.data.name, data.data.website.toString() || '');

  if (result instanceof AppError) {
    return {
      ...error,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: `Successfully created attribute "${data.data.name}"`,
  };
}

export async function updateBrandAction(id: number, unsafeData: z.infer<typeof brandSchema>) {
  const data = brandSchema.safeParse(unsafeData);

  return {
    error: true,
    message: 'Unimplemented action',
  };
}

export async function deleteBrandAction(id: number) {
  return await deleteBrand(id);
}
