'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { paginatedProductsType } from '@/drizzle/queries/products';
import { formatDateTime } from '@/lib/utils';
import { empty } from '@/lib/empty';

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

export function formatFieldValue(
  product: paginatedProductsType,
  field: keyof paginatedProductsType
): React.ReactNode {
  const value = product[field];

  if (field === 'categories') {
    if (empty(product.categories)) {
      return '-';
    }
    return product.categories ? Object.values(product.categories).join(', ') : '-';
  }

  if (field === 'createdAt') {
    return product.createdAt ? formatDateTime(product.createdAt) : '-';
  }

  if (empty(value) || value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return value.toString();
}

export function ProductTableBody({
  products,
  stringParams,
  columns,
}: {
  products: paginatedProductsType[];
  stringParams: string;
  columns: Column[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: number) => {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id.toString());

        const res = await fetch('/api/admin/products/', {
          method: 'DELETE',
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          toast.success('Product deleted successfully');
          router.push(`/admin/products?${stringParams}`);
          router.refresh();
        } else {
          toast.error(result.message ?? 'Failed to delete product');
        }
      } catch (error) {
        toast.error(
          'Unexpected error occurred: ' + (error instanceof Error ? error.message : 'Unknown error')
        );
      }
    });
  };

  if (products.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
            No data available
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="relative">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/80 md:absolute md:inset-0 md:z-10 md:bg-muted/60">
          <Loader2 className="h-24 w-24 animate-spin text-muted-foreground" />
        </div>
      )}
      {products.map((product, i) => (
        <tr key={i} className="block md:table-row border border-border rounded-lg mb-4 md:mb-0">
          {columns
            .filter((field) => field.key !== 'actions')
            .map((field) => (
              <td key={field.key} className="block md:border md:table-cell px-4 py-2 text-sm">
                <div className="flex md:block gap-2">
                  <span className="font-medium text-muted-foreground md:hidden">
                    {field.label}:
                  </span>
                  <span>
                    {field.key === 'price' && product.salePrice ? (
                      <>
                        <span className="line-through text-muted-foreground mr-2">
                          {formatFieldValue(product, 'price')}
                        </span>
                        <span className="text-green-600 font-semibold">
                          {formatFieldValue(product, 'salePrice')}
                        </span>
                      </>
                    ) : (
                      formatFieldValue(product, field.key as keyof paginatedProductsType)
                    )}
                  </span>
                </div>
              </td>
            ))}
          <td className="block md:border md:table-cell px-4 py-2 text-sm">
            <div className="flex gap-2">
              <Link href={`/admin/products/edit/${product.id}`} title="Edit">
                <Pencil />
              </Link>
              <button
                type="button"
                onClick={() => handleDelete(product.id)}
                disabled={isPending}
                className="text-red-500"
                title="Delete"
              >
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
