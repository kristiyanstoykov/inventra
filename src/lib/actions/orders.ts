'use server';

import z from 'zod';
import { OrderSchema } from '../schema/orders';
import { createOrder, deleteOrder, updateOrder } from '@/db/drizzle/queries/orders';
import { AppError } from '../appError';

export async function createOrderAction(data: z.infer<typeof OrderSchema>) {
  const result = await createOrder(data);

  return result;
}

export async function updateOrderAction(id: number, data: z.infer<typeof OrderSchema>) {
  const result = await updateOrder(id, data);

  return result;
}

export async function deleteOrderAction(orderId: number) {
  const result = await deleteOrder(orderId);
  if (result instanceof AppError) {
    return {
      success: false,
      error: true,
      message: result.toString(),
    };
  }

  return result;
}
