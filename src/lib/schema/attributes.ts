import { z } from 'zod';

export const attributeSchema = z.object({
  name: z.string().min(1, 'Name of attribute is required'),
  value: z.coerce.number().min(1, 'Value of attribute is required'),
  unit: z.string().min(1, 'Unit of attribute measurement is required'),
});
