import { z } from 'zod';

export const categorySchema = z.object({
  catName: z.string().min(1, 'Category name is required'),
});

export const categoryUpdateSchema = z.object({
  catName: z.string().min(1, 'Category name is required'),
  catSlug: z.string().min(1, 'Category slug is required'),
});
