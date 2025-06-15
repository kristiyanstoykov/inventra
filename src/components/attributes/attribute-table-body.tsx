'use client';

import { paginatedAttributesType } from '@/drizzle/queries/attributes';
import { empty } from '@/lib/empty';
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
  category: paginatedAttributesType,
  field: keyof paginatedAttributesType
): React.ReactNode {
  const value = category[field];

  if (empty(value) || value === null || value === undefined) {
    return '-';
  }

  return value.toString();
}

export function AttributeTableBody({
  attributes: attributes,
  columns,
}: {
  attributes: paginatedAttributesType[];
  columns: Column[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: number) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id.toString());

        const res = await fetch('/api/admin/attributes/', {
          method: 'DELETE',
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          toast.success(`Attribute #${id} deleted successfully`);
          router.refresh();
        } else {
          toast.error(result.message ?? 'Failed to delete attribute');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Unexpected error occurred.');
      }
    });
  }

  if (!attributes.length) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
            No attributes found.
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
      {attributes.map((category, i) => (
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
                    {formatFieldValue(category, col.key as keyof paginatedAttributesType)}
                  </span>
                </div>
              </td>
            ))}
          <td className="block md:table-cell md:border px-4 py-2 text-sm">
            <div className="flex gap-2">
              <Link href={`/admin/products/attributes/edit/${category.id}`} title="Edit">
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
