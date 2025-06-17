'use client';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userSchema } from './schema';
import { Select } from '../ui/select';

type EditUserFormProps = {
  user: {
    id: number;
    email: string;
    role: 'user' | 'admin' | 'client' | 'customer';
    isCompany?: boolean;
    firstName?: string;
    lastName?: string;
    companyName?: string;
    bulstat?: string;
    vatNumber?: string;
    phone?: string;
    address?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
  };
};

export function UserEditForm({ user }: EditUserFormProps) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof userSchema>>({
    defaultValues: {
      email: user.email,
      password: '',
      role: ['user', 'admin', 'client'].includes(user.role)
        ? (user.role as 'user' | 'admin' | 'client')
        : 'client',
      firstName: user.firstName,
      lastName: user.lastName,
      companyName: user.companyName || '',
      bulstat: user.bulstat,
      vatNumber: user.vatNumber,
      phone: user.phone,
      address: user.address,
    },
  });

  async function onSubmit(values: z.infer<typeof userSchema>) {
    setError(undefined);
    startTransition(async () => {
      try {
        // Validate input using userSchema before sending
        const parsedValues = userSchema.safeParse(values);
        if (!parsedValues.success) {
          throw new Error('Invalid input. Please check the form fields.');
        }

        // Send data as FormData to match the API expectations
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          // Convert boolean to string for FormData
          if (typeof value === 'boolean') {
            formData.append(key, value ? 'true' : 'false');
          } else if (typeof value === 'undefined' || value === undefined || value === null) {
            // Skip undefined/null values
            return;
          } else {
            formData.append(key, value as string);
          }
        });

        const res = await fetch('/api/admin/user', {
          method: 'PUT',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message || 'Failed to add user.');
        }

        form.reset();
        router.refresh();
        toast.success('User added successfully');
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        toast.error('There was an error adding the user: ' + (err.message || 'Unexpected error.'));
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && <p className="text-destructive">{error}</p>}

        <FormField
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} type="email" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} type="password" autoComplete="off" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* First Name and Last Name on one row */}
        <div className="flex gap-4">
          <FormField
            name="firstName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="lastName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Role dropdown and Is Company checkbox on one row */}
        <div className="flex gap-4">
          <FormField
            name="role"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Role</FormLabel>
                <FormControl>
                  <Select {...field} disabled={isPending}>
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="client">Client</option>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="companyName"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Company Name</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <FormField
            name="phone"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            name="address"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Address</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* BULSTAT and VAT Number on one row */}
        <div className="flex gap-4">
          <FormField
            name="bulstat"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>BULSTAT</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="vatNumber"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>VAT Number</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update user'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
