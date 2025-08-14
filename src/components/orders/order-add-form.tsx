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
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/LoadingSwap';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { OrderSchema, OrderType } from '@/lib/schema/orders';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Banknote, CalendarIcon, CreditCard } from 'lucide-react';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { InitialItem, SelectProductsField } from './product-search-field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { InferSelectModel } from 'drizzle-orm';
import { PaymentTypesTable } from '@/db/drizzle/schema';
import { createOrderAction } from '@/lib/actions/orders';
import { AppError } from '@/lib/appError';
import { ClientComboBox } from './client-search-field';
import { SignInForm } from '@/auth/nextjs/components/SignInForm';
import { SignUpForm } from '@/auth/nextjs/components/SignUpForm';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent } from '../ui/card';
import { UserFormFields } from '../users/user-form-fields';

export function OrderForm({
  order,
  initialClient,
  paymentTypesList,
  initialItems,
  roles,
}: {
  order: Pick<OrderType, 'id' | 'items' | 'date' | 'clientId'>;
  paymentTypesList: InferSelectModel<typeof PaymentTypesTable>[];
  initialClient?: { id: number; name: string } | null;
  initialItems?: InitialItem[] | null;
  roles: {
    id: number;
    name: string;
  }[];
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

  // const form = useForm();

  async function onSubmit(data: z.infer<typeof OrderSchema>) {
    // async function onSubmit(data) {
    try {
      const parsedData = OrderSchema.safeParse(data);
      toast.success(<pre>{JSON.stringify(parsedData, null, 2)}</pre>);

      return;
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
        <div className="grid gap-6 md:grid-cols-2">
          {/* Column 1: Date + Payment Type */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col w-full">
                      <FormLabel>Date of order</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={'outline'}
                              className={cn(
                                'w-full pl-3 text-left font-normal',
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
              </div>
            </CardContent>
          </Card>

          {/* Column 2: Tabs (Client selection / Create) */}
          <Card>
            <CardContent>
              <div className="space-y-6">
                <Tabs
                  defaultValue="existing"
                  className="w-full"
                  onValueChange={(val) => {
                    if (val === 'new') {
                      form.setValue(
                        'clientId',
                        {
                          firstName: '',
                          lastName: '',
                          email: '',
                          phone: '',
                          isCompany: false,
                          roleId:
                            roles.find((r) => r.name.toLowerCase() === 'client')?.id ??
                            roles[0]?.id,
                          companyName: '',
                          bulstat: '',
                          vatNumber: '',
                          address: '',
                        },
                        { shouldDirty: true, shouldValidate: false }
                      );
                    } else {
                      // existing
                      form.setValue('clientId', undefined, {
                        shouldDirty: true,
                        shouldValidate: false,
                      });
                    }
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="existing">Existing user</TabsTrigger>
                    {!order && <TabsTrigger value="new">Create User</TabsTrigger>}
                  </TabsList>

                  <TabsContent value="existing" className="mt-4">
                    <ClientComboBox
                      form={form}
                      name="clientId"
                      label="Client"
                      initialClient={initialClient}
                    />
                  </TabsContent>

                  <TabsContent value="new" className="mt-4 space-y-6">
                    <UserFormFields form={form} roles={roles} base="clientId" />
                  </TabsContent>
                </Tabs>
              </div>
            </CardContent>
          </Card>
        </div>

        <SelectProductsField
          control={form.control}
          name="items"
          label="Items"
          initialItems={initialItems}
        />

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
