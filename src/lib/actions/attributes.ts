'use server';

import { z } from 'zod';
import { attributeSchema } from '../schema/attributes';
import { AppError } from '../appError';
import {
  createAttribute,
  deleteAttribute,
  updateAttributeById,
} from '@/db/drizzle/queries/attributes';

export async function createAttributeAction(unsafeData: z.infer<typeof attributeSchema>) {
  const data = attributeSchema.safeParse(unsafeData);

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

  if (!data.data.name || data.data.name.trim() === '') {
    return {
      ...error,
      message: 'Name of attribute is required',
    };
  }

  if (data.data.value === null) {
    return {
      ...error,
      message: 'Value of attribute must be a number',
    };
  }

  if (data.data.unit === null || data.data.unit.trim() === '') {
    return {
      ...error,
      message: 'Unit of attribute measurement is required',
    };
  }

  const result = await createAttribute(data.data.name, data.data.value.toString(), data.data.unit);

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

export async function updateAttributeAction(
  id: number,
  unsafeData: z.infer<typeof attributeSchema>
) {
  const parsed = attributeSchema.safeParse(unsafeData);

  const error = {
    error: true,
    message: 'Unimplemented action',
  };

  if (!parsed.success) {
    return {
      ...error,
      message: 'Invalid attribute data',
    };
  }

  if (!parsed.data.name || parsed.data.name.trim() === '') {
    return {
      ...error,
      message: 'Name of attribute is required',
    };
  }

  if (parsed.data.value === null) {
    return {
      ...error,
      message: 'Value of attribute must be a number',
    };
  }

  if (parsed.data.unit === null || parsed.data.unit.trim() === '') {
    return {
      ...error,
      message: 'Unit of attribute measurement is required',
    };
  }

  const result = await updateAttributeById(
    id,
    parsed.data.name,
    parsed.data.value.toString(),
    parsed.data.unit
  );

  if (result instanceof AppError) {
    return {
      ...error,
      message: result.toString(),
    };
  }

  return {
    error: false,
    message: `Successfully updated attribute "${parsed.data.name}"`,
  };
}

export async function deleteAttributeAction(id: number) {
  return await deleteAttribute(id);
}
