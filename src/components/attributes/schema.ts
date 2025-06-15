import { z } from 'zod';

export const attributeSchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  value: z.string().min(1, 'Category name is required'),
  unit: z.string().min(1, 'Category name is required'),
});
