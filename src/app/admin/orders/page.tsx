import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { AppError } from '@/lib/appError';
import { DataTableSearchClient } from '@/components/dataTable/DataTableSearchClient';
import { OrdersTable, SkeletonOrdersTable } from '@/components/orders/table';
import { getPaginatedOrders } from '@/db/drizzle/queries/orders';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Orders',
};

type SearchParams = Promise<{
  page?: string;
  sort?: `${string}.${'asc' | 'desc'}`;
  search?: string;
  perPage?: string;
}>;

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="m-4">
          <Heading size={'h3'} as={'h1'} className="mb-4">
            Orders
          </Heading>
          <DataTableSearchClient />
          <SkeletonOrdersTable />
        </div>
      }
    >
      <SuspendedPage searchParams={searchParams} />
    </Suspense>
  );
}

async function SuspendedPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const pageNum = parseInt(params.page ?? '1', 10) || 1;
  const perPage = parseInt(params.perPage ?? '10', 10) || 10;
  const [sortKey = 'id', sortDir = 'asc'] =
    (params.sort?.split('.') as [string, 'asc' | 'desc']) ?? [];
  const search = params.search ?? '';

  const result = await getPaginatedOrders(pageNum, perPage, sortKey, sortDir);

  if (result instanceof AppError) {
    return (
      <div className="p-4">
        <Heading size={'h3'} as={'h1'}>
          Error loading orders
        </Heading>
        <p>{result.message}</p>
      </div>
    );
  }

  const { data, total, page, pageSize, totalPages } = result;

  return (
    <div className="m-4">
      <div className="flex">
        <Heading size={'h3'} as={'h1'} className="mb-4 mr-4">
          Orders
        </Heading>
        <Link href="orders/new">
          <Button variant={'addition'}>
            <PlusIcon /> Create new Order
          </Button>
        </Link>
      </div>
      <div className="">
        <DataTableSearchClient />
        <Suspense fallback={<SkeletonOrdersTable />}>
          <OrdersTable
            orders={data}
            total={total}
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
          />
        </Suspense>
      </div>
    </div>
  );
}
