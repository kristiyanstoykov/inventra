'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { AttributeTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { AppError } from '@/lib/appError';
import { ActionButton } from '../ActionButton';

type Attributes = InferSelectModel<typeof AttributeTable>;

function getColumns(): ColumnDef<Attributes>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="ID" column={column} />
      ),
      cell: ({ row }) => row.original.id,
    },
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Name" column={column} />
      ),
      cell: ({ row }) => {
        const name = row.original.name;

        return (
          <div className="flex items-center gap-2">
            <span>{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'value',
      accessorFn: (row) => parseFloat(row.value),
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Value" column={column} />
      ),
      cell: ({ row }) => {
        const price = parseFloat(row.original.value);
        return (
          <div className="flex items-center gap-2">
            <span>{price.toFixed(2)}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'unit',
      accessorFn: (row) => row.unit,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Unit" column={column} />
      ),
      cell: ({ row }) => {
        return (
          <div className="flex items-center gap-2">
            <span>{row.original.unit}</span>
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div>Actions</div>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <ActionCell id={id} />;
      },
    },
  ];
}

export function SkeletonAttributesTable() {
  return (
    <AttributesTable
      attributes={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function AttributesTable({
  attributes,
  noResultsMessage = 'No products found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  attributes: Attributes[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={attributes}
      columns={getColumns()}
      noResultsMessage={noResultsMessage}
      initialFilters={[]}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  );
}

function ActionCell({ id }: { id: number }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleDelete(id: number) {
    const data = {
      error: false,
      message: `Successfully deleted attribute #${id}`,
    };

    // const result = await deleteProductAction(id);
    // if (result instanceof AppError) {
    //   data.error = true;
    //   data.message = result.toString();
    //   return data;
    // }

    // if (!result.success) {
    //   toast.error('Unknown error occurred while deleting product');
    //   data.error = true;
    //   data.message = 'Unknown error occurred while deleting product';
    //   return data;
    // }

    return data;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`${pathname}/edit/${id}`}
        className="inline-flex items-center justify-center rounded-md"
        aria-label="Edit"
      >
        <Button variant={'outline'}>
          <PencilIcon className="size-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </Link>
      <ActionButton
        action={async () => handleDelete(id)}
        requireAreYouSure={true}
        areYouSureDescription="This action cannot be undone. Are you sure you want to delete this product?"
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
