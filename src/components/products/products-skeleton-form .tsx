'use client';

import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSwap } from '@/components/LoadingSwap';
import { Select, SelectTrigger, SelectValue } from '../ui/select';

export function ProductSkeletonForm() {
  const form = useForm();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(() => {})}
        className="space-y-6 @container animate-pulse"
      >
        <div className="flex flex-col md:flex-row gap-6">
          {/* LEFT MAIN FORM - 57% */}
          <div className="flex-1 md:max-w-[57%] space-y-6 md:border-r-2 md:pr-6">
            {/* Row 1: Name 70% + SKU 30% */}
            <div className="grid xl:grid-cols-[70%_30%] gap-4 xl:pr-4">
              <FormField
                name="name"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="sku"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Row 2: Price, Sale Price, Delivery Price, Quantity */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <FormField
                name="price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="sale_price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="delivery_price"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Price</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                name="quantity"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input disabled placeholder="Loading..." {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Row 3: Serial Number */}
            <FormField
              name="sn"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input disabled placeholder="Loading..." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>

          {/* RIGHT SIDEBAR - 40% */}
          <div className="md:w-[40%] space-y-6">
            {/* Brand */}
            <FormField
              name="brand_id"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Loading Brands..." />
                      </SelectTrigger>
                    </Select>
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Categories */}
            <FormField
              control={form.control}
              name="category_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Loading Categories..." />
                      </SelectTrigger>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attributes */}
            <FormField
              control={form.control}
              name="attribute_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attributes</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Loading Attributes..." />
                      </SelectTrigger>
                    </Select>
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
          <LoadingSwap isLoading={true}>Loading...</LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
