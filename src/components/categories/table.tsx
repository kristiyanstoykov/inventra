'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProductCategoryTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
// import { toast } from 'sonner';
// import { AppError } from '@/lib/appError';
import { ActionButton } from '../ActionButton';

type Categories = InferSelectModel<typeof ProductCategoryTable>;

function getColumns(): ColumnDef<Categories>[] {
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
      accessorKey: 'slug',
      accessorFn: (row) => row.slug,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Slug" column={column} />
      ),
      cell: ({ row }) => {
        const slug = row.original.slug;
        return (
          <div className="flex items-center gap-2">
            <span>{slug}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Created on" column={column} />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
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

export function SkeletonCategoriesTable() {
  return (
    <CategoriesTable
      categories={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function CategoriesTable({
  categories,
  noResultsMessage = 'No products found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  categories: Categories[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={categories}
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
      message: `Successfully deleted category #${id}! NOTE: THIS IS NOT YET IMPLEMENTED`,
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
        areYouSureDescription="This action cannot be undone. Are you sure you want to delete this category?"
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
