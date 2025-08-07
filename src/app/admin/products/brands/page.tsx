import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { AppError } from '@/lib/appError';
import { DataTableSearchClient } from '@/components/dataTable/DataTableSearchClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrandsTable, SkeletonBrandsTable } from '@/components/brands/table';
import { getPaginatedBrands } from '@/db/drizzle/queries/brands';
import { BrandForm } from '@/components/brands/brand-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'All Brands',
};

type SearchParams = Promise<{
  page?: string;
  sort?: `${string}.${'asc' | 'desc'}`;
  search?: string;
  perPage?: string;
}>;

export default function BrandsPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="m-4">
          <Heading size={'h3'} as={'h1'} className="mb-4">
            Brands
          </Heading>
          <DataTableSearchClient />
          <SkeletonBrandsTable />
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

  const result = await getPaginatedBrands(pageNum, perPage, sortKey, sortDir, search);
  if (result instanceof AppError) {
    return (
      <div className="p-4">
        <Heading size={'h3'} as={'h1'}>
          Error loading brands
        </Heading>
        <p>{result.message}</p>
      </div>
    );
  }

  const { data, total, page, pageSize, totalPages } = result;

  return (
    <div className="m-4">
      <Heading size={'h3'} as={'h1'} className="mb-4">
        Brands
      </Heading>
      <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-4 mt-4">
        <div className="flex flex-col gap-4 items-stretch mt-2">
          <Card className="max-w-[500px]">
            <CardHeader>
              <CardTitle>Add new brand</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <BrandForm brand={null} />
            </CardContent>
          </Card>
        </div>
        <div className="">
          <DataTableSearchClient />
          <Suspense fallback={<SkeletonBrandsTable />}>
            <BrandsTable
              brands={data}
              total={total}
              page={page}
              pageSize={pageSize}
              totalPages={totalPages}
            />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
