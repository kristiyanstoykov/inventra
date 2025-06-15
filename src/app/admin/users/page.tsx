import { DataTableSearchControls } from '@/components/ui/data-table/data-table-search-controls';
import { Heading } from '@/components/ui/heading';
import { UsersDataTable } from '@/components/users/users-data-table';
import { Loader2 } from 'lucide-react';
import { Suspense } from 'react';

export default async function UsersPage({
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

  return (
    <>
      <Heading size={'h3'} as={'h1'}>
        Users
      </Heading>
      <DataTableSearchControls search={search} queryParams={stringParams} />
      <Suspense
        fallback={
          <div className="p-4 flex">
            Loading users...<Loader2 className="animate-spin"></Loader2>
          </div>
        }
      >
        <UsersDataTable
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
