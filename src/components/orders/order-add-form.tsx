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
import { Banknote, CalendarIcon, CreditCard } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { SelectProductsField } from './product-search-field';
import { SelectSearchClient } from './client-search-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InferSelectModel } from 'drizzle-orm';
import { PaymentTypesTable } from '@/db/drizzle/schema';
import { createOrderAction } from '@/lib/actions/orders';
import { AppError } from '@/lib/appError';

export function OrderForm({
  order,
  paymentTypesList,
}: {
  order: Pick<OrderType, 'id' | 'items' | 'date' | 'clientId'>;
  paymentTypesList: InferSelectModel<typeof PaymentTypesTable>[];
}) {
  const router = useRouter();

  const form = useForm({
    resolver: zodResolver(OrderSchema),
    defaultValues: {
      date: order?.date ?? new Date(),
      items: [],
      paymentType: paymentTypesList.find((p) => p.name === 'cash') ?? paymentTypesList[0],
    },
  });

  async function onSubmit(data: z.infer<typeof OrderSchema>) {
    try {
      // toast.success(
      //   <>
      //     Order added successfully!
      //     <pre className="mt-2 w-full whitespace-pre-wrap">
      //       {JSON.stringify(data, null, 2).replace(/</g, '&lt;').replace(/>/g, '&gt;')}
      //     </pre>
      //   </>,
      //   { dismissible: true }
      // );

      const result = await createOrderAction(data);

      if (result instanceof AppError) {
        throw new Error(result.toString());
      }

      if (!result.success) {
        throw new Error(result.message);
      }

      toast.success(result.message);
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
              <FormLabel>Date of order</FormLabel>
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

        <SelectSearchClient
          control={form.control}
          name="clientId"
          label="Client"
          // Optional: resolve label when editing existing orders
          // resolveLabel={async (id) => (await getUserByIdAction(id))?.name ?? null}
        />

        {/* Payment type */}

        <FormField
          name="paymentType"
          control={form.control}
          render={({ field }) => {
            const currentId = field.value?.id?.toString() ?? '';

            return (
              <FormItem>
                <FormLabel>Payment Type</FormLabel>
                <FormControl>
                  <Select
                    value={currentId}
                    onValueChange={(val) => {
                      const id = Number(val);
                      const selected = paymentTypesList.find((p) => p.id === id);
                      if (selected) field.onChange(selected);
                    }}
                    disabled={!paymentTypesList?.length}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose payment type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypesList.map((p) => (
                        <SelectItem key={p.id} value={p.id.toString()}>
                          {p.name === 'cash' && <Banknote className="mr-2 h-4 w-4" />}
                          {p.name === 'card' && <CreditCard className="mr-2 h-4 w-4" />}
                          {p.name.charAt(0).toUpperCase() + p.name.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            );
          }}
        />

        <SelectProductsField control={form.control} name="items" label="Items" />

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
