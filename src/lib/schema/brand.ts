import { z } from 'zod';

export const brandSchema = z.object({
  name: z.string().min(1, 'Name of brand is required'),
  website: z.string().min(1, 'Website of brand is required'),
});
