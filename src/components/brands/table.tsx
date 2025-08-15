'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProductBrandTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { ActionButton } from '../ActionButton';
import { deleteBrand } from '@/db/drizzle/queries/brands';
import { AppError } from '@/lib/appError';
import { toast } from 'sonner';
import { deleteBrandAction } from '@/lib/actions/brands';

type Brands = InferSelectModel<typeof ProductBrandTable>;

function getColumns(): ColumnDef<Brands>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => <DataTableSortableColumnHeader title="ID" column={column} />,
      cell: ({ row }) => row.original.id,
    },
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => <DataTableSortableColumnHeader title="Name" column={column} />,
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
      accessorKey: 'website',
      accessorFn: (row) => row.website,
      header: ({ column }) => <DataTableSortableColumnHeader title="Website" column={column} />,
      cell: ({ row }) => {
        const website = row.original.website;
        return (
          <div className="flex items-center gap-2">
            <span>{website || '-'}</span>
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

export function SkeletonBrandsTable() {
  return (
    <BrandsTable
      brands={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function BrandsTable({
  brands,
  noResultsMessage = 'No brands found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  brands: Brands[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={brands}
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
    const result = await deleteBrandAction(id);
    if (result instanceof AppError) {
      return {
        error: true,
        message: result.toString(),
      };
    }
    if (result.error) {
      toast.error(result.message);
      return result;
    }
    return result;
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
        areYouSureDescription="This action cannot be undone. Are you sure you want to delete this brand?"
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
