'use client';

import * as React from 'react';
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
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AppError } from '@/lib/appError';
import { LoadingSwap } from '../LoadingSwap';
import { ACCEPTED_TYPES, OptionsFormValues, optionsSchema } from '@/lib/schema/options';
import { updateOptionsBulkAction } from '@/lib/actions/options';
import { empty } from '@/lib/empty';
import { Loader2 } from 'lucide-react';

export default function CompanySettingsForm({ options }: { options: OptionsFormValues }) {
  const router = useRouter();
  const [preview, setPreview] = React.useState<string | null>(null);
  const [objectUrl, setObjectUrl] = React.useState<string | null>(null);

  const form = useForm<OptionsFormValues>({
    resolver: zodResolver(optionsSchema),
    defaultValues: {
      companyName: options.companyName || '',
      uic: options.uic || '',
      vatNumber: options.vatNumber || '',
      email: options.email || '',
      phone: options.phone || '',
      address: options.address || '',
      city: options.city || '',
      postalCode: options.postalCode || '',
      country: options.country || 'Bulgaria',
      representative: options.representative || '',
      notes: options.notes || '',
      logo: options.logo || '',
      logoObj: null,
    },
  });

  // Preview when file changes (overrides URL preview)
  const logoFile = form.watch('logoObj');
  React.useEffect(() => {
    // cleanup any previous object URL
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
      setObjectUrl(null);
    }

    if (logoFile instanceof File) {
      const url = URL.createObjectURL(logoFile);
      setObjectUrl(url);
      setPreview(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }

    // If file cleared, fall back to logoUrl
    const url = form.getValues('logo');
    setPreview(url || null);
  }, [logoFile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial preview from persisted URL (when no file is selected)
  React.useEffect(() => {
    const file = form.getValues('logoObj');
    const url = form.getValues('logo');
    if (!file && url) setPreview(url || null);
  }, [form]);

  async function onInvalid(errors: unknown) {
    // Extract and show concise validation messages
    function flattenMessages(input: unknown, prefix = '', seen = new WeakSet<object>()): string[] {
      if (!input) return [];

      // Error instance
      if (input instanceof Error) return [input.message];

      // Arrays
      if (Array.isArray(input)) {
        return input.flatMap((item) => flattenMessages(item, prefix, seen));
      }

      // Primitive (string/number/etc.) - no message path
      if (typeof input !== 'object') return [];

      // Prevent circular refs
      if (seen.has(input as object)) return [];
      seen.add(input as object);

      // FieldError-like (has message)
      if ('message' in (input as any) && typeof (input as any).message === 'string') {
        const msg = (input as any).message as string;
        return prefix ? [`${prefix}: ${msg}`] : [msg];
      }

      // Generic object: recurse properties
      return Object.entries(input as Record<string, unknown>).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key;
        return flattenMessages(value, path, seen);
      });
    }

    const messages = flattenMessages(errors);

    toast.error(
      <div className="whitespace-pre-line">
        {messages.length ? `Validation errors:\n${messages.join('\n')}` : 'Validation failed.'}
      </div>
    );
  }

  async function onSubmit(data: OptionsFormValues) {
    // Build FormData (this is the key change)
    const fd = new FormData();
    // append primitives
    fd.append('companyName', data.companyName ?? '');
    fd.append('uic', data.uic ?? '');
    fd.append('vatNumber', data.vatNumber ?? '');
    fd.append('email', data.email ?? '');
    fd.append('phone', data.phone ?? '');
    fd.append('address', data.address ?? '');
    fd.append('city', data.city ?? '');
    fd.append('postalCode', data.postalCode ?? '');
    fd.append('country', data.country ?? '');
    fd.append('representative', data.representative ?? '');
    fd.append('notes', data.notes ?? '');
    // current persisted URL (hidden input bound to `logo`)
    fd.append('logo', data.logo ?? '');

    // append file only if present
    if (data.logoObj instanceof File) {
      fd.append('logoObj', data.logoObj);
    }

    const result = await updateOptionsBulkAction(fd); // <- server action must accept FormData

    if (result instanceof AppError) {
      toast.error(
        <div>
          <pre>{JSON.stringify(result.toJSON(), null, 2)}</pre>
        </div>
      );

      return result;
    }

    if (!result) {
      toast.error('Failed to update settings');
      return result;
    }

    toast.success('Successfully updated options');
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-6 @container">
          {/* Hidden/visible field for persisted URL (optional: keep it visible for manual paste) */}
          <FormField
            name="logo"
            control={form.control}
            render={({ field }) => <input type="hidden" {...field} />}
          />

          {/* File picker + preview */}
          <FormField
            name="logoObj"
            control={form.control}
            render={() => (
              <FormItem>
                <FormLabel>Company logo (upload new)</FormLabel>
                <FormControl>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept={ACCEPTED_TYPES.join(',')}
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        form.setValue('logoObj', file as File | null, { shouldValidate: true });
                      }}
                    />
                    {!empty(options) && !empty(options.logo) && !preview ? (
                      <div className="w-64 h-64 flex items-center justify-center">
                        <Loader2 className="w-16 h-16 animate-spin" />
                      </div>
                    ) : preview ? (
                      <Image
                        src={preview}
                        alt="Logo preview"
                        className="w-64 rounded-md border"
                        width={256}
                        height={256}
                      />
                    ) : null}
                  </div>
                </FormControl>
                <p className="text-xs text-muted-foreground">PNG, JPEG, WEBP or SVG. Max 2MB.</p>
                <FormMessage />
              </FormItem>
            )}
          />

          <Separator />

          {/* Basic company info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="companyName"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="example: ACME OOD" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="uic"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bulstat / UIC</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="9 or 13 digits" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="vatNumber"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>VAT number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="BG123456789" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="email"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email (for invoices)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="billing@company.tld" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="phone"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="+359 88 123 4567" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="representative"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Manager</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Manager's name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Address */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              name="address"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Street, No, Floor, Office" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="city"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Sofia" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="postalCode"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Postal code</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="1000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="country"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Bulgaria" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Notes */}
          <FormField
            name="notes"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Text for warranty card</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    className="h-92 d:h-48"
                    rows={10}
                    placeholder="Additional text/conditions..."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={form.formState.isSubmitting} type="submit" className="w-full">
            <LoadingSwap isLoading={form.formState.isSubmitting}>Save settings</LoadingSwap>
          </Button>
        </form>
      </Form>
    </div>
  );
}
