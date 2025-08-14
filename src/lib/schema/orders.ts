import { z } from 'zod';
import { paymentTypes } from '@/db/drizzle/schema';
import { userSchema } from './users';

export const OrderItemSchema = z.object({
  productId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().int().min(1),
});

// Accept id + name for payment type
export const PaymentTypeSchema = z.object({
  id: z.coerce.number().int().positive(),
  name: z.enum(paymentTypes),
});

export const OrderSchema = z.object({
  id: z.number().int().optional(),
  date: z.date({
    required_error: 'A date of order is required.',
  }),
  items: z.array(OrderItemSchema).min(1, 'Add at least one item to the order.'),
  paymentType: PaymentTypeSchema,
  // clientId: z.number().int(),
  clientId: z.union([z.coerce.number().int().positive(), userSchema]),
});

export type OrderType = z.infer<typeof OrderSchema>;
export type OrderItemType = z.infer<typeof OrderItemSchema>;
export type PaymentTypeType = z.infer<typeof PaymentTypeSchema>;
