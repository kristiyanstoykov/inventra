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
import { attributeSchema } from '@/lib/schema/attributes';
import {
  createAttributeAction,
  updateAttributeAction,
} from '@/lib/actions/attributes';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';

type AttributeType = {
  id: number;
  name: string;
  value: number;
  unit: string;
};

export function AttributeForm({
  attribute,
}: {
  attribute: Pick<AttributeType, 'id' | 'name' | 'value' | 'unit'>;
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(attributeSchema),
    defaultValues: attribute ?? {
      name: '',
      value: null,
      unit: '',
    },
  });

  async function onSubmit(data: z.infer<typeof attributeSchema>) {
    try {
      const action = attribute
        ? updateAttributeAction.bind(null, attribute.id)
        : createAttributeAction;

      const res = await action(data);

      if (res.error) {
        throw new Error(res.message || 'An error occurred while processing.');
      }

      form.reset();
      router.refresh();
      toast.success('Attribute added successfully');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      toast.error(
        'There was an error adding the attribute: ' +
          (err.message || 'Unexpected error.')
      );
    }
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

        <div className="col-span-full md:col-span-1">
          <div className="grid grid-cols-2 gap-2">
            {/* Value */}
            <FormField
              name="value"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      value={field.value ?? ''}
                      onChange={(e) =>
                        field.onChange(
                          isNaN(e.target.valueAsNumber)
                            ? null
                            : e.target.valueAsNumber
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="unit"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <Button
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {attribute ? 'Update Attribute' : 'Add Attribute'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
