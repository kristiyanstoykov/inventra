import { z } from 'zod';

export const userSchema = z
  .object({
    id: z.number().optional(), // optional for create
    // name: z.string(),
    email: z.string().email(),
    isCompany: z.boolean(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    companyName: z.string().optional(),
    bulstat: z.string().optional(),
    vatNumber: z.string().optional(),
    phone: z.string().min(1, 'Phone is required'),
    address: z.string().optional(),
    roleId: z.coerce.number(),
  })
  .superRefine((data, ctx) => {
    // Company fields validation
    if (data.isCompany) {
      if (!data.companyName)
        ctx.addIssue({
          path: ['companyName'],
          message: 'Company name is required',
          code: 'custom',
        });
      if (!data.bulstat)
        ctx.addIssue({
          path: ['bulstat'],
          message: 'Bulstat is required',
          code: 'custom',
        });
      if (!data.address)
        ctx.addIssue({
          path: ['address'],
          message: 'Address is required',
          code: 'custom',
        });
    }
  });

export type UserType = z.infer<typeof userSchema>;
