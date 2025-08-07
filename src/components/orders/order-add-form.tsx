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
import { ProductSchema, ProductType } from '@/lib/schema/products';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { FancyMultiSelect } from '@/components/ui/multi-select';
import {
  createProductAction,
  updateProductAction,
} from '@/lib/actions/products';
import { empty } from '@/lib/empty';

export function ProductForm({
  product,
  brands,
  attributes,
  categories,
}: {
  product: Pick<
    ProductType,
    | 'id'
    | 'name'
    | 'sku'
    | 'price'
    | 'salePrice'
    | 'deliveryPrice'
    | 'quantity'
    | 'sn'
    | 'brandId'
  >;
  brands: { id: number; name: string }[];
  attributes: { id: number; name: string }[];
  categories: { id: number; name: string }[];
}) {
  const router = useRouter();

  const form = useForm<z.infer<typeof ProductSchema>>({
    resolver: zodResolver(ProductSchema),
    defaultValues: product ?? {
      name: '',
      sku: '',
      price: 0,
      salePrice: 0,
      deliveryPrice: 0,
      quantity: 0,
      sn: '',
      brandId: '',
      categoryIds: [],
      attributeIds: [],
    },
  });

  async function onSubmit(data: z.infer<typeof ProductSchema>) {
    try {
      const action =
        product && product.id
          ? updateProductAction.bind(null, product.id)
          : createProductAction;

      const res = await action(data);

      if (res.error) {
        throw new Error(res.message || 'An error occurred while processing.');
      }

      if (product) {
        router.push('/admin/products/edit/' + product.id);
      } else {
        form.reset();
        router.refresh();
      }

      toast.success(res.message || 'Action completed successfully.');
    } catch (err: any) {
      toast.error(
        'There was an error adding the product: ' +
          (err.message || 'Unexpected error.'),
        {
          dismissible: true,
        }
      );
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6 @container"
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="salePrice"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sale Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? 0}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                name="deliveryPrice"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Delivery Price</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
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
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* RIGHT SIDEBAR - 40% */}
          <div className="md:w-[40%] space-y-6">
            {/* Brand */}
            <FormField
              name="brandId"
              control={form.control}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Brand</FormLabel>
                  <FormControl>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={
                        product &&
                        (product.brandId === null ||
                          product.brandId === undefined)
                          ? ''
                          : !empty(product)
                          ? String(product.brandId)
                          : ''
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose Brand" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">No brand</SelectItem>
                        {brands.map((brand: { id: number; name: string }) => (
                          <SelectItem key={brand.id} value={String(brand.id)}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Categories */}
            <FormField
              control={form.control}
              name="categoryIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categories</FormLabel>
                  <FormControl>
                    <FancyMultiSelect
                      options={categories}
                      value={field.value || []}
                      onChange={(val) => field.onChange(val.map(Number))}
                      placeholder="Choose categories"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Attributes */}
            <FormField
              control={form.control}
              name="attributeIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Attributes</FormLabel>
                  <FormControl>
                    <FancyMultiSelect
                      options={attributes || []}
                      value={field.value || []}
                      onChange={(val) => field.onChange(val.map(Number))}
                      placeholder="Choose attributes"
                    />
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
            {product ? 'Update Product' : 'Add Product'}
          </LoadingSwap>
        </Button>
      </form>
    </Form>
  );
}
