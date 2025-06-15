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
import { attributeSchema } from './schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { createAttributeAction } from '@/app/admin/products/attributes/actions';

export function AttributeForm() {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof attributeSchema>>({
    defaultValues: {
      name: '',
      value: '',
      unit: '',
    },
  });

  async function onSubmit(values: z.infer<typeof attributeSchema>) {
    setError(undefined);
    startTransition(async () => {
      try {
        const parsedValues = attributeSchema.safeParse(values);

        if (!parsedValues.success) {
          throw new Error('Invalid input. Please check the form fields.');
        }

        const result = await createAttributeAction(values);
        if (result?.error) {
          throw new Error(result.error);
        }

        form.reset();
        router.refresh();
        toast.success('Attribute added successfully');
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred.');
        toast.error(
          'There was an error adding the category: ' + (err.message || 'Unexpected error.')
        );
      }
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {error && <p className="text-destructive">{error}</p>}
        <FormField
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-4">
          <FormField
            name="value"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Value</FormLabel>
                <FormControl>
                  <Input {...field} disabled={isPending} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            name="unit"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Unit</FormLabel>
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
            {isPending ? 'Adding...' : 'Add attribute'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
