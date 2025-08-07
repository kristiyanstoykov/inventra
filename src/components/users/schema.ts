import { z } from 'zod';

// User schema
export const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  roleId: z.string(),
  role: z.enum(['user', 'admin', 'client']).optional(),
  isCompany: z.boolean().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  bulstat: z.string().optional(),
  vatNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const userEditSchema = z.object({
  id: z.coerce.number().int().positive(),
  email: z.string().email().optional(),
  password: z.string().optional(),
  roleId: z.string().optional(),
  role: z.enum(['user', 'admin', 'client']).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  companyName: z.string().optional(),
  bulstat: z.string().optional(),
  vatNumber: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});
