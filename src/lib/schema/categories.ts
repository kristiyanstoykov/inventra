import { z } from 'zod';

export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Name of category is required'),
});

export const categoryUpdateSchema = z.object({
  name: z.string().min(1, 'Name of category is required'),
  slug: z.string().min(1, 'Slug of category is required'),
});
