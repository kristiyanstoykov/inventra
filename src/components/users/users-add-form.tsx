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
import { useEffect, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { userSchema } from './schema';
import { Select } from '../ui/select';
import { Loader2 } from 'lucide-react';
import { RoleTable } from '@/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';

type Role = InferSelectModel<typeof RoleTable>;

export function UserAddForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [loadingRoles, setLoadingRoles] = useState(true);
  const [roles, setRoles] = useState<Role[]>([]);
  useEffect(() => {
    fetch('/api/admin/roles')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || 'Failed to fetch roles');
        }
        setRoles(data.data);
      })
      .catch((err) => {
        setRoles([]);
        setError('Failed to load roles: ' + (err.message || 'Unknown error'));
      })
      .finally(() => {
        setLoadingRoles(false);
      });
  }, []);

  const form = useForm<z.infer<typeof userSchema>>({
    defaultValues: {
      email: '',
      password: '',
      role: 'client',
      isCompany: false,
      firstName: '',
      lastName: '',
      companyName: '',
      bulstat: '',
      vatNumber: '',
      phone: '',
      address: '',
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
          // Convert boolean to string for FormData);
          if (typeof value === 'undefined' || value === undefined || value === null) {
            // Skip undefined/null values
            return;
          } else {
            formData.append(key, value as string);
          }
        });

        const res = await fetch('/api/admin/user', {
          method: 'POST',
          body: formData,
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.message + data.errors || 'Failed to add user.');
        }

        form.reset();
        router.refresh();
        toast.success('User added successfully');
      } catch (error) {
        // Simulate NextResponse.json error handling in client-side context
        const message = error instanceof Error ? error.message : 'Internal server error';
        setError(message);
        toast.error('There was an error adding the user: ' + message);
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
            name="roleId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Role</FormLabel>
                <FormControl>
                  {loadingRoles ? (
                    <div className="flex items-center h-9 px-3 border border-border-input rounded-md bg-input">
                      <Loader2 className="animate-spin h-4 w-4 text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">Loading roles...</span>
                    </div>
                  ) : (
                    <Select {...field} disabled={isPending}>
                      <option value="">Select a role</option>
                      {Array.isArray(roles) &&
                        roles.map((role) => (
                          <option key={String(role.id)} value={String(role.id)}>
                            {role.name as unknown as string}
                          </option>
                        ))}
                    </Select>
                  )}
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
            {isPending ? 'Adding...' : 'Add user'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
