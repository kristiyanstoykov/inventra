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
import { useTransition } from 'react';
import {
  categoryCreateSchema,
  categoryUpdateSchema,
} from '@/lib/schema/categories';
import {
  updateCategoryAction,
  createCategoryAction,
} from '@/lib/actions/categories';

type CategoryType = {
  id: number;
  name: string;
  slug: string;
};

export function CategoriesForm({
  attribute,
}: {
  attribute: Pick<CategoryType, 'id' | 'name' | 'slug'>;
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  const schema = attribute ? categoryUpdateSchema : categoryCreateSchema;

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: attribute ?? {
      name: '',
      slug: '',
    },
  });

  async function onSubmit(data: z.infer<typeof schema>) {
    startTransition(async () => {
      try {
        const action = attribute
          ? updateCategoryAction.bind(null, attribute.id)
          : createCategoryAction;
        const res = await action(data);

        if (res.error) {
          throw new Error(res.message || 'An error occurred while processing.');
        }

        if (attribute) {
          router.push('/admin/products/categories');
        } else {
          form.reset();
          router.refresh();
        }
        toast.success(res.message || 'Action completed successfully.');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (err: any) {
        toast.error(
          'There was an error adding the attribute: ' +
            (err.message || 'Unexpected error.')
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 @container"
      >
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

        {attribute && (
          <FormField
            name="slug"
            control={form.control}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Slug</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {attribute ? 'Update Category' : 'Add Category'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
