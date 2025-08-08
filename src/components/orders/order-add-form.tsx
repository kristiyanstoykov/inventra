'use client';

import { useForm } from 'react-hook-form';
import { format } from 'date-fns';
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
import { OrderSchema, OrderType } from '@/lib/schema/orders';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CalendarIcon } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { SelectProductsField } from './search-product-field';

export function OrderForm({
  order,
  brands,
  attributes,
  categories,
}: {
  order: Pick<
    OrderType,
    'id' | 'name' | 'sku' | 'price' | 'salePrice' | 'deliveryPrice' | 'quantity' | 'sn' | 'brandId'
  >;
  brands: { id: number; name: string }[];
  attributes: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();

  // const FormSchema = z.object({
  //   name: z.string().min(1, 'Name is required.'),
  //   date: z.date({
  //     required_error: 'A date of order is required.',
  //   }),
  // });

  // const form = useForm<z.infer<typeof FormSchema>>({
  //   resolver: zodResolver(FormSchema),
  //   defaultValues: {
  //     date: order?.date ?? new Date(),
  //   },
  // });

  const form = useForm();

  async function onSubmit(data) {
    try {
      console.log('Form data:', data);

      toast.success(
        <>
          Order added successfully!
          <pre className="mt-2 w-full whitespace-pre-wrap">
            {JSON.stringify(data, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
          </pre>
        </>,
        { dismissible: true }
      );
    } catch (err: any) {
      toast.error('There was an error adding the order: ' + (err.message || 'Unexpected error.'), {
        dismissible: true,
      });
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 @container">
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Date of birth</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={'outline'}
                      className={cn(
                        'w-[240px] pl-3 text-left font-normal',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    captionLayout="dropdown"
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />

        <SelectProductsField control={form.control} />

        <Button
          variant="addition"
          disabled={form.formState.isSubmitting}
          type="submit"
          className="w-full"
        >
          <LoadingSwap isLoading={form.formState.isSubmitting}>
            {order ? 'Update Order' : 'Create Order'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
