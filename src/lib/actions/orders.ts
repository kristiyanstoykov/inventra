'use server';

import z from 'zod';
import { OrderSchema } from '../schema/orders';
import { createOrder } from '@/db/drizzle/queries/orders';

export async function createOrderAction(data: z.infer<typeof OrderSchema>) {
  console.log('Order data submitted:', data);

  const result = await createOrder(data);

  return result;
}
