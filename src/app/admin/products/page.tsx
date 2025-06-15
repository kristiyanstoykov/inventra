import { AppError } from '@/lib/appError';
import { getPaginatedProducts } from '@/drizzle/queries/products';
import { DataTableSearchControls } from '@/components/ui/data-table/DataTableSearchControls';
import { ProductDataTable } from '../../../components/products/product-data-table';
import { Heading } from '@/components/ui/heading';

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const stringParams = new URLSearchParams({ ...params }).toString();

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const search = params.search ?? '';
  const productsPerPage = 50;

  const result = await getPaginatedProducts(page, productsPerPage, sortKey, sortDir, search);
  if (result instanceof AppError) {
    return <div>Error: {result.toString()}</div>;
  }

  const { data: products, total, pageSize } = result;
  const totalPages = Math.max(1, Math.ceil(total / Math.max(1, pageSize)));
  const currentPage = Math.min(page, totalPages);

  return (
    <>
      <Heading size={'h3'} as={'h1'}>
        Products
      </Heading>
      <DataTableSearchControls />
      <div className="w-full overflow-x-auto rounded-md">
        <ProductDataTable
          data={products}
          page={page}
          pageSize={pageSize}
          total={total}
          sortKey={sortKey}
          sortDirection={sortDir}
          queryParams={stringParams}
          currentPage={currentPage}
        />
      </div>
    </>
  );
}
