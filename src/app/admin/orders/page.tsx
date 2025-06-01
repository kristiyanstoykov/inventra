import { DataTable } from '@/components/ui/data-table/data-table';
import { AppError } from '@/lib/appError';
import { getPaginatedOrders } from '@/drizzle/queries/orders';

type OrdersPageProps = {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'id';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const ordersPerPage = 10;

  const result = await getPaginatedOrders(page, ordersPerPage, sortKey, sortDir);
  if (result instanceof AppError) {
    return <div>Error: {result.toString()}</div>;
  }

  const { data: orders, total, pageSize } = result;

  return (
    <DataTable
      columns={[
        { key: 'id', label: '#', sortable: true },
        { key: 'clientNames', label: 'Client', sortable: true },
        { key: 'status', label: 'Status', sortable: true },
        { key: 'createdAt', label: 'Created at', sortable: true },
      ]}
      data={orders}
      page={page}
      pageSize={pageSize}
      total={total}
      sortKey={sortKey}
      sortDirection={sortDir}
    />
  );
}
