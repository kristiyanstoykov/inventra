import { z } from 'zod';

export const categorySchema = z.object({
  catName: z.string().min(1, 'Category name is required'),
});
