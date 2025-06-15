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
import { categorySchema } from './schema';
import { useRouter } from 'next/navigation';
import { createCategoryAction } from '../../app/admin/products/categories/actions';
import { toast } from 'sonner';

export function CategoryForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof categorySchema>>({
    defaultValues: {
      catName: '',
    },
  });

  async function onSubmit(values: z.infer<typeof categorySchema>) {
    setError(undefined);
    startTransition(async () => {
      const result = await createCategoryAction(values);
      if (result?.error) {
        setError(result.error);
        toast.error('There was an error adding the category: ' + result.error);
      } else {
        form.reset();
        router.refresh();
        toast.success('Category added successfully');
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

        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Adding...' : 'Add category'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
