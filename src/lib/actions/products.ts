'use server';

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from '@/db/drizzle/queries/products';
import { AppError } from '@/lib/appError';
import { ProductSchema } from '../schema/products';
import z from 'zod';

export async function createProductAction(
  unsafeData: z.infer<typeof ProductSchema>
) {
  const data = ProductSchema.safeParse(unsafeData);

  if (!data.success) {
    return {
      error: true,
      message: 'Invalid product form data',
    };
  }

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      error: true,
      message: 'Name of product is required',
    };
  }

  const result = await createProduct(data.data);

  if (result instanceof AppError) {
    return {
      error: true,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: result?.errorMessage
      ? result.errorMessage
      : `Successfully created product "${data.data.name}"`,
  };
}

export async function updateProductAction(
  id: number,
  unsafeData: z.infer<typeof ProductSchema>
) {
  if (!id) {
    return {
      error: true,
      message: 'Product ID is required',
    };
  }

  const data = ProductSchema.safeParse(unsafeData);

  if (!data.success) {
    return {
      error: true,
      message: 'Invalid product form data',
    };
  }

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      error: true,
      message: 'Name of product is required',
    };
  }

  const result = await updateProduct(id, data.data);

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

export async function deleteProductAction(id: number) {
  try {
    if (!id) {
      throw new AppError('Product ID is required', '400', 'INVALID_PRODUCT_ID');
    }

    if (typeof id !== 'number' || isNaN(id)) {
      throw new AppError(
        'Product ID must be a valid number',
        '400',
        'INVALID_PRODUCT_ID'
      );
    }

    const result = await deleteProduct(id);
    if (result instanceof AppError) {
      throw result;
    }

    return { success: true, message: `Product #${id} deleted successfully` };
  } catch (error: AppError | unknown) {
    const message = error.message ?? `Failed to delete product with ID: ${id}`;
    const code = '500';
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(message, code, 'DELETE_PRODUCT_ERROR');
  }
}
