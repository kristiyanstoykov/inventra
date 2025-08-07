'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { OrderTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { ActionButton } from '../ActionButton';
import { OrderBadge } from '../ui/badge-order-status';

type Orders = InferSelectModel<typeof OrderTable> & {
  clientFirstName: string;
  clientLastName: string;
  clientNames: string;
  clientCompany: string;
  orderTotal: string;
};

function getColumns(): ColumnDef<Orders>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="ID" column={column} />
      ),
      cell: ({ row }) => {
        const id = row.original.id;
        const clientFirstName = row.original.clientFirstName;
        const clientLastName = row.original.clientLastName;

        return (
          <div className="flex items-center gap-2">
            <span>
              <Link
                href={`/orders/edit/${id}`}
                className="text-blue-800 hover:underline"
              >
                #{id} {clientFirstName} {clientLastName}
              </Link>
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Date" column={column} />
      ),
      cell: ({ row }) => {
        const date = row.original.createdAt;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
      },
    },
    {
      accessorKey: 'orderTotal',
      accessorFn: (row) => row.clientFirstName,
      header: ({ column }) => (
        <DataTableSortableColumnHeader title="Total" column={column} />
      ),
      cell: ({ row }) => {
        const orderTotal = row.original.orderTotal;

        return (
          <div className="flex items-center gap-2">
            <span>{orderTotal}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'Status',
      accessorFn: (row) => row.status,
      cell: ({ row }) => {
        const status = row.original.status;

        return (
          <div className="flex items-center gap-2">
            {(() => {
              switch (status) {
                case 'pending':
                  return <OrderBadge variant="pending">Pending</OrderBadge>;
                case 'completed':
                  return <OrderBadge variant="completed">Completed</OrderBadge>;
                case 'cancelled':
                  return <OrderBadge variant="cancelled">Cancelled</OrderBadge>;
                default:
                  return <OrderBadge variant="secondary">Unknown</OrderBadge>;
              }
            })()}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const id = row.original.id;
        return <ActionCell id={id} />;
      },
    },
  ];
}

export function SkeletonOrdersTable() {
  return (
    <OrdersTable
      orders={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function OrdersTable({
  orders,
  noResultsMessage = 'No orders found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  orders: Orders[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={orders}
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
      message: `Successfully deleted product #${id}`,
    };

    toast.error('Unimplemented action');

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
        areYouSureDescription="This action cannot be undone. Are you sure you want to delete this order?"
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
