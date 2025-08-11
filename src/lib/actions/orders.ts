import z from 'zod';
import { OrderSchema } from '../schema/orders';

export async function createOrderAction(data: z.infer<typeof OrderSchema>) {
  console.log('Order data submitted:', data);

  const result = createOrder(data);

  return data; // Return the created order data or any relevant response
}
