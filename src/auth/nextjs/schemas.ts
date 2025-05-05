import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const signUpSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});
