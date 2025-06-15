'use client';

import { paginatedCategoriesType } from '@/drizzle/queries/categories';
import { empty } from '@/lib/empty';
import { formatDateTime } from '@/lib/utils';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

export function formatFieldValue(
  category: paginatedCategoriesType,
  field: keyof paginatedCategoriesType
): React.ReactNode {
  const value = category[field];

  if (field === 'createdAt') {
    return category.createdAt ? formatDateTime(category.createdAt) : '-';
  }

  if (empty(value) || value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return value.toString();
}

export function CategoryTableBody({
  categories,
  columns,
}: {
  categories: paginatedCategoriesType[];
  columns: Column[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: number) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id.toString());

        const res = await fetch('/api/admin/category/', {
          method: 'DELETE',
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          toast.success(`Category #${id} deleted successfully`);
          router.refresh();
        } else {
          toast.error(result.message ?? 'Failed to delete category');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Unexpected error occurred.');
      }
    });
  }

  if (!categories.length) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
            No categories found.
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
      {categories.map((category, i) => (
        <tr
          key={i}
          className="block md:table-row border border-border rounded-lg md:hover:bg-muted/80 mb-4 md:mb-0"
        >
          {columns
            .filter((col) => col.key !== 'actions')
            .map((col) => (
              <td key={col.key} className="block md:table-cell md:border px-4 py-2 text-sm">
                <div className="flex md:block gap-2">
                  <span className="font-medium text-muted-foreground md:hidden">{col.label}:</span>
                  <span>
                    {formatFieldValue(category, col.key as keyof paginatedCategoriesType)}
                  </span>
                </div>
              </td>
            ))}
          <td className="block md:table-cell md:border px-4 py-2 text-sm">
            <div className="flex gap-2">
              <Link href={`/admin/products/categories/edit/${category.id}`} title="Edit">
                <Pencil />
              </Link>
              <button
                onClick={() => handleDelete(category.id)}
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
