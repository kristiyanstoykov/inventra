import { z } from 'zod';

export const MAX_FILE_SIZE = 2 * 1024 * 1024;
export const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'];

export const optionsSchema = z.object({
  companyName: z.string().min(2, 'Minimum 2 characters'),
  uic: z.string().regex(/^\d{9}(\d{4})?$/, 'Bulstat/UIC must be 9 or 13 digits'),
  vatNumber: z
    .string()
    .trim()
    .transform((v) => v.toUpperCase())
    .refine(
      (v) => v === '' || /^(BG)?\d{9,10}$/.test(v),
      'Example: BG123456789 (prefix BG optional)'
    ),
  email: z.string().email('Invalid email'),
  phone: z.string().min(6, 'Minimum 6 characters'),
  address: z.string().min(2, 'Minimum 2 characters'),
  city: z.string().min(2, 'Minimum 2 characters'),
  postalCode: z.string().min(2, 'Minimum 2 characters'),
  country: z.string().min(2, 'Minimum 2 characters'),
  representative: z.string().min(1, 'Minimum 1 character'),
  notes: z.string().optional().or(z.literal('')),

  // URL used for preview + persisted to DB (maps to options key "logo")
  logo: z
    .string()
    .trim()
    .refine((v) => v === '' || /^(https?:\/\/|\/|data:|blob:).+/.test(v), 'Invalid URL')
    .optional(),

  // optional file for replacing the logo; validate only if provided
  logoObj: z
    .instanceof(File)
    .optional()
    .nullable()
    .refine((f) => !f || f.size <= MAX_FILE_SIZE, 'Maximum 2MB')
    .refine((f) => !f || ACCEPTED_TYPES.includes(f.type), 'Allowed: PNG, JPEG, WEBP, SVG'),
});

export type OptionsFormValues = z.infer<typeof optionsSchema>;
