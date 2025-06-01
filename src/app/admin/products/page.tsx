import { DataTable } from '@/components/ui/data-table/data-table';
import { AppError } from '@/lib/appError';
import { getPaginatedProducts } from '@/drizzle/queries/products';

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  }>;
};

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const productsPerPage = 10;

  const result = await getPaginatedProducts(page, productsPerPage, sortKey, sortDir);
  if (result instanceof AppError) {
    return <div>Error: {result.toString()}</div>;
  }

  const { data: products, total, pageSize } = result;

  return (
    <DataTable
      columns={[
        { key: 'id', label: '#', sortable: true },
        { key: 'name', label: 'Name', sortable: true },
        { key: 'sku', label: 'SKU', sortable: true },
        { key: 'sn', label: 'SN', sortable: true },
        { key: 'price', label: 'Price', sortable: true },
        { key: 'categories', label: 'Categories', sortable: false },
        { key: 'salePrice', label: 'Sale price', sortable: true },
        { key: 'deliveryPrice', label: 'Delivery price', sortable: true },
        { key: 'quantity', label: 'Quantity', sortable: true },
      ]}
      data={products}
      page={page}
      pageSize={pageSize}
      total={total}
      sortKey={sortKey}
      sortDirection={sortDir}
    />
  );
}
