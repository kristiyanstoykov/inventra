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
import { useState, useTransition, useEffect } from 'react';
import { categoryUpdateSchema } from './schema';
import { useRouter } from 'next/navigation';
import { updateCategoryAction } from '@/app/admin/products/categories/actions';
import { toast } from 'sonner';

type Category = {
  id: number;
  name: string;
  slug: string;
  createdAt?: Date;
  updatedAt?: Date;
};

type UpdateCategoryFormProps = {
  category: Category;
};

export function UpdateCategoryForm({ category }: UpdateCategoryFormProps) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof categoryUpdateSchema>>({
    defaultValues: {
      catName: category.name || '',
      catSlug: category.slug || '',
    },
  });

  // If the category prop changes, update the form values
  useEffect(() => {
    form.reset({
      catName: category.name || '',
      catSlug: category.slug || '',
    });
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof categoryUpdateSchema>) {
    setError(undefined);
    startTransition(async () => {
      const result = await updateCategoryAction(category.id, values);
      if (result?.error) {
        setError(result.error);
        toast.error('There was an error updating the category: ' + result.error);
      } else {
        router.refresh();
        toast.success('Category updated successfully');
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && <p className="text-destructive">{error}</p>}

        <FormField
          name="catName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          name="catSlug"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category slug</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Updating...' : 'Update category'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
