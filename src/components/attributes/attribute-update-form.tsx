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
import { attributeSchema } from './schema';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { updateAttributeAction } from '@/app/admin/products/attributes/actions';

type Attribute = {
  id: number;
  name: string;
  value: string | null;
  unit: string | null;
};

type UpdateAttributeFormProps = {
  attribute: Attribute;
};

export function UpdateAttributeForm({ attribute: category }: UpdateAttributeFormProps) {
  const [error, setError] = useState<string>();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<z.infer<typeof attributeSchema>>({
    defaultValues: {
      name: category.name || '',
      value: category.value || '',
      unit: category.unit || '',
    },
  });

  // If the attribute prop changes, update the form values
  useEffect(() => {
    form.reset({
      name: category.name || '',
      value: category.value || '',
      unit: category.unit || '',
    });
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof attributeSchema>) {
    setError(undefined);
    startTransition(async () => {
      const result = await updateAttributeAction(category.id, values);
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
            {isPending ? 'Updating...' : 'Update attribute'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
