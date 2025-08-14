'use client';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { FieldValues, UseFormReturn } from 'react-hook-form';

type Props<TFieldValues extends FieldValues = FieldValues> = {
  form: UseFormReturn<TFieldValues>;
  roles: {
    id: number;
    name: string;
  }[];
  base?: string; // e.g. "clientId"
};

export function UserFormFields({ form, roles, base }: Props) {
  const path = (k: string) => (base ? (`${base}.${k}` as never) : (k as never));
  const isCompany = form.watch(path('isCompany'));

  function getDefaultRoleId(roles: { id: number; name: string }[]): number | undefined {
    return roles.find((r) => r.name.toLowerCase() === 'client')?.id;
  }

  return (
    <>
      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name={path('firstName')}
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
          name={path('lastName')}
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
          name={path('email')}
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
          name={path('phone')}
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
          name={path('roleId')}
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
        name={path('isCompany')}
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
            name={path('companyName')}
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
              name={path('bulstat')}
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
              name={path('vatNumber')}
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
            name={path('address')}
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
    </>
  );
}
