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
import { brandSchema } from '@/lib/schema/brand';
import { createBrandAction, updateBrandAction } from '@/lib/actions/brands';

export type BrandType = {
  id: number;
  name: string;
  website?: string | null;
};

export function BrandForm({ brand }: { brand: Pick<BrandType, 'id' | 'name' | 'website'> | null }) {
  const router = useRouter();

  const form = useForm<z.infer<typeof brandSchema>>({
    resolver: zodResolver(brandSchema),
    defaultValues: {
      name: brand?.name ?? '',
      website: brand?.website ?? '',
    },
  });

  async function onSubmit(data: z.infer<typeof brandSchema>) {
    try {
      const action = brand ? updateBrandAction.bind(null, brand.id) : createBrandAction;

      const res = await action(data);

      if (res.error) {
        throw new Error(res.message || 'An error occurred while processing.');
      }

      if (!brand) {
        form.reset();
        toast.success('Attribute added successfully');
      } else {
        toast.success('Attribute updated successfully');
        router.refresh();
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(
        'There was an error adding the attribute: ' + (err.message || 'Unexpected error.')
      );
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 @container">
        <FormField
          name="name"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Website */}
        <FormField
          name="website"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website</FormLabel>
              <FormControl>
                <Input {...field} type="text" value={field.value ?? ''} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button disabled={form.formState.isSubmitting} type="submit" className="w-full">
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {brand ? 'Update Brand' : 'Add Brand'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
