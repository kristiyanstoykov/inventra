import { z } from 'zod';

// User schema
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['user', 'admin', 'client']), // adjust roles as needed
  isCompany: z.boolean(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  bulstat: z.string().optional(),
  vatNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
