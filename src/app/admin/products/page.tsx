import { ProductsTable, SkeletonProductsTable } from '@/components/products/table';
import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { getPaginatedProducts } from '@/db/drizzle/queries/products';
import { AppError } from '@/lib/appError';
import { DataTableSearchClient } from '@/components/dataTable/DataTableSearchClient';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'All Products',
};

type SearchParams = Promise<{
  page?: string;
  sort?: `${string}.${'asc' | 'desc'}`;
  search?: string;
  perPage?: string;
}>;

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="m-4">
          <Heading size={'h3'} as={'h1'} className="mb-4">
            Products
          </Heading>
          <DataTableSearchClient />
          <SkeletonProductsTable />
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
  const [sortKey = 'id', sortDir = 'desc'] =
    (params.sort?.split('.') as [string, 'asc' | 'desc']) ?? [];
  const search = params.search ?? '';

  const result = await getPaginatedProducts(pageNum, perPage, sortKey, sortDir, search);
  if (result instanceof AppError) {
    return (
      <div className="p-4">
        <Heading size={'h3'} as={'h1'}>
          Error loading products
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
          Products
        </Heading>
        <Link href="products/new">
          <Button variant={'addition'}>
            <PlusIcon /> Add Product
          </Button>
        </Link>
      </div>
      <DataTableSearchClient />
      <Suspense fallback={<SkeletonProductsTable />}>
        <ProductsTable
          products={data}
          total={total}
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
        />
      </Suspense>
    </div>
  );
}
