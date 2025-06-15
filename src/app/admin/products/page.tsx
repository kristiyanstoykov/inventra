import { DataTableSearchControls } from '@/components/ui/data-table/DataTableSearchControls';
import { ProductDataTable } from '../../../components/products/product-data-table';
import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';

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
  console.log('Search Params:', stringParams);

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const search = params.search ?? '';

  return (
    <>
      <Heading size={'h3'} as={'h1'}>
        Products
      </Heading>
      <DataTableSearchControls search={search} queryParams={stringParams} />
      <Suspense
        fallback={
          <div className="p-4 flex">
            Loading products...<Loader2 className="animate-spin"></Loader2>
          </div>
        }
      >
        <ProductDataTable
          page={page}
          sortKey={sortKey}
          sortDirection={sortDir}
          search={search}
          queryParams={stringParams}
        />
      </Suspense>
    </>
  );
}
