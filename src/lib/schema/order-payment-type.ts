import { z } from 'zod';

export const OrderPaymentTypeEnum = z.enum(['cash', 'card']);
export type OrderPaymentType = z.infer<typeof OrderPaymentTypeEnum>;
