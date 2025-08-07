'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { z } from 'zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/LoadingSwap';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { userSchema, UserType } from '@/lib/schema/users';
import { Switch } from '../ui/switch';
import { createUserAction, updateUserAction } from '@/lib/actions/users';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

export function UserForm({
  user,
  roles,
}: {
  user: Pick<
    UserType,
    | 'id'
    | 'name'
    | 'email'
    | 'isCompany'
    | 'firstName'
    | 'lastName'
    | 'companyName'
    | 'bulstat'
    | 'vatNumber'
    | 'phone'
    | 'address'
    | 'roleId'
  > | null;
  roles: {
    id: number;
    name: string;
  }[];
}) {
  const router = useRouter();
  const isEdit = !!user?.id;

  const form = useForm<z.infer<typeof userSchema>>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      id: user?.id ?? undefined,
      name: user?.name ?? '',
      email: user?.email ?? '',
      isCompany: user?.isCompany ?? false,
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      companyName: user?.companyName ?? '',
      bulstat: user?.bulstat ?? '',
      vatNumber: user?.vatNumber ?? '',
      phone: user?.phone ?? '',
      address: user?.address ?? '',
      roleId: user?.roleId ?? getDefaultRoleId(roles),
    },
  });

  const isCompany = form.watch('isCompany');

  async function onSubmit(data: z.infer<typeof userSchema>) {
    try {
      const action = user?.id ? updateUserAction.bind(null, user.id) : createUserAction;

      const res = await action(data);

      if (res.error) {
        throw new Error(res.message || 'An error occurred while processing.');
      }

      if (user) {
        router.refresh();
      } else {
        form.reset();
        if (res.userId) {
          router.push('/admin/users/edit/' + res.userId);
        } else {
          router.push('/admin/users');
        }
      }

      toast.success(isEdit ? 'User updated successfully' : 'User created successfully');
    } catch (err: unknown) {
      toast.error(
        'There was an error processing the user: ' + (err.message || 'Unexpected error.')
      );
    }
  }

  function getDefaultRoleId(roles: { id: number; name: string }[]): number | undefined {
    return roles.find((r) => r.name.toLowerCase() === 'client')?.id;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 @container">
        {/* Basic Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input placeholder="John" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input placeholder="Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="john@example.com" autoComplete="off" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+359 888 123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-10 gap-4">
          <FormField
            name="roleId"
            control={form.control}
            render={({ field }) => (
              <FormItem className="col-span-5">
                <FormLabel>Role</FormLabel>
                <FormControl>
                  {roles.length > 0 ? (
                    <Select
                      onValueChange={(value) => field.onChange(Number(value))}
                      defaultValue={
                        field.value !== 0 && field.value !== undefined
                          ? String(field.value)
                          : String(getDefaultRoleId(roles))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Role" />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role) => (
                          <SelectItem key={role.id} value={String(role.id)}>
                            {String(role.name).charAt(0).toUpperCase() + String(role.name).slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input disabled placeholder="No roles available" />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* isCompany Toggle */}
        <FormField
          control={form.control}
          name="isCompany"
          render={({ field }) => (
            <FormItem className="col-span-7 flex items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Is Company?</FormLabel>
                <p className="text-sm text-muted-foreground">Toggle if this user is a company</p>
              </div>
              <FormControl>
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Company Fields (conditional) */}
        {isCompany && (
          <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Ltd" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Bulstat & VAT Number on one row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bulstat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bulstat</FormLabel>
                    <FormControl>
                      <Input placeholder="123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="vatNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Number</FormLabel>
                    <FormControl>
                      <Input placeholder="BG123456789" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Address</FormLabel>
                  <FormControl>
                    <Input placeholder="Sofia, Bulgaria" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
          variant={isEdit ? 'update' : 'addition'}
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {isEdit ? 'Update User' : 'Create User'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
