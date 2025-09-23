import { z } from 'zod';

export const ProductSchema = z.object({
  id: z.number().optional(), // Make optional for create
  name: z.string().min(1),
  sku: z.string().optional(),
  sn: z.string().optional(),
  price: z.coerce.number(), // converts string → number
  salePrice: z.coerce.number().optional(),
  warranty: z.coerce.number().optional(),
  deliveryPrice: z.coerce.number(),
  quantity: z.coerce.number(),
  brandId: z.coerce.number().optional(),
  categoryIds: z.array(z.coerce.number().optional()),
  attributeIds: z.array(z.coerce.number().optional()),
});

export type ProductType = z.infer<typeof ProductSchema>;
