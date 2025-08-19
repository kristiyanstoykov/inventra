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
import {
  Banknote,
  ChevronsUpDown,
  CreditCard,
  FileBadge2,
  PencilIcon,
  ReceiptEuro,
  TrashIcon,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { ActionButton } from '../ActionButton';
import { OrderBadge } from '../ui/badge-order-status';
import { empty } from '@/lib/empty';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { deleteOrderAction } from '@/lib/actions/orders';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { generateInvoiceAction } from '@/lib/actions/invoices';
import { useInvoiceDownload } from '@/hooks/useInvoiceDownload';
import { LoadingSwap } from '../LoadingSwap';

type Orders = InferSelectModel<typeof OrderTable> & {
  clientFirstName: string;
  clientLastName: string;
  clientNames: string;
  clientCompany: string;
  orderTotal: string;
  paymentTypeId: number;
  paymentType: string;
  items?: {
    id: number;
    productId: number;
    name: string;
    quantity: number;
    price: string;
  }[];
};

function getColumns(): ColumnDef<Orders>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => <DataTableSortableColumnHeader title="ID" column={column} />,
      cell: ({ row }) => {
        const id = row.original.id;
        const clientFirstName = row.original.clientFirstName;
        const clientLastName = row.original.clientLastName;

        return (
          <div className="flex items-center gap-2">
            <span>
              <Link
                href={`/orders/edit/${id}`}
                className="text-blue-800 dark:text-blue-300 hover:underline"
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
      header: ({ column }) => <DataTableSortableColumnHeader title="Date" column={column} />,
      cell: ({ row }) => {
        const v = row.original.createdAt;
        const d = v instanceof Date ? v : new Date(v);
        if (Number.isNaN(d.getTime())) return '—';

        const formatted = new Intl.DateTimeFormat('bg-BG', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: 'Europe/Sofia',
        }).format(d);

        return formatted;
      },
    },
    {
      accessorKey: 'Items',
      accessorFn: (row) => row.items,
      cell: ({ row }) => {
        const items = row.original.items;

        return (
          <div className="flex items-center gap-2">
            {empty(items) || empty(items[0]) || empty(items[0].id) ? (
              <span>No items found</span>
            ) : (
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="cursor-pointer">
                    Click to view items <ChevronsUpDown className="size-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-3">
                  <ul className="text-[0.8rem] my-1 list-disc pl-5 [&>li]:mt-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <div className="flex items-start gap-2">
                          <span>
                            #{item.productId} {item.name}
                            <br />
                            Quantity: {item.quantity}
                            <br />
                            {item.quantity > 1 ? (
                              <>
                                Price: {item.quantity}x {item.price}:{' '}
                                {(Number(item.price) * item.quantity).toFixed(2)}
                              </>
                            ) : (
                              <>Price: {parseFloat(item.price).toFixed(2)}</>
                            )}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </PopoverContent>
              </Popover>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'orderTotal',
      accessorFn: (row) => row.clientFirstName,
      header: ({ column }) => <DataTableSortableColumnHeader title="Total" column={column} />,
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
      accessorKey: 'Payment type',
      accessorFn: (row) => row.paymentType,
      cell: ({ row }) => {
        const paymentType = row.original.paymentType;

        return (
          <div className="flex items-center gap-2">
            {(() => {
              switch (paymentType) {
                case 'cash':
                  return (
                    <OrderBadge
                      variant="outline"
                      className="border border-emerald-700 dark:border-emerald-300"
                    >
                      <Banknote className="size-4 text-emerald-600 dark:text-emerald-300" />
                      Cash
                    </OrderBadge>
                  );
                case 'card':
                  return (
                    <OrderBadge
                      variant="outline"
                      className="border border-amber-600 dark:border-amber-200"
                    >
                      <CreditCard className="size-4 text-amber-600 dark:text-amber-200" />
                      Card
                    </OrderBadge>
                  );
                default:
                  return <OrderBadge variant="outline">Unknown</OrderBadge>;
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
  const { handleInvoice, downloadingId } = useInvoiceDownload();

  async function handleDelete(id: number) {
    const result = await deleteOrderAction(id);

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
        areYouSureDescription={`This action cannot be undone. Are you sure you want to delete order #${id}?`}
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <ActionButton
              variant={'secondary'}
              className="border border-emerald-500 bg-emerald-100 dark:bg-emerald-700 dark:hover:bg-emerald-800"
              action={async () => {
                await new Promise((res) => setTimeout(res, 1000));
                console.log(`Order #${id}`);
                return {
                  error: true,
                  message: 'Unimplemented warranty action',
                };
              }}
            >
              <FileBadge2 className="size-4" />
            </ActionButton>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-sm">
            Warranty card
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => handleInvoice(id)}
              disabled={downloadingId === id}
              variant={'secondary'}
              className="border border-emerald-500 bg-emerald-100 dark:bg-emerald-700 dark:hover:bg-emerald-800"
            >
              <LoadingSwap isLoading={downloadingId === id}>
                <ReceiptEuro className="size-4" />
              </LoadingSwap>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-sm">
            Invoice
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
}
