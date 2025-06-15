'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Column, formatFieldValue } from './product-data-table';
import { paginatedProductsType } from '@/drizzle/queries/products';

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
        const res = await fetch(`/api/products/delete/${id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });

        console.log('Delete response:', res);

        const result = await res.json();

        if (result.success) {
          toast.success('Product deleted successfully');
          router.push(`/admin/products?${stringParams}`);
          router.refresh();
        } else {
          toast.error(result.message ?? 'Failed to delete product', {
            dismissible: true,
            closeButton: true,
            duration: Infinity,
          });
        }
      } catch (error) {
        toast.error(
          'Unexpected error occurred: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
          {
            dismissible: true,
            closeButton: true,
            duration: Infinity,
          }
        );
        console.error(error);
      }
    });
  };

  if (products.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={10} className="px-4 py-4 text-center text-muted-foreground">
            No data available
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <>
      <tbody className="relative">
        {/* Spinner overlay when loading */}
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
    </>
  );
}
