import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { AppError } from '@/lib/appError';
import { DataTableSearchClient } from '@/components/dataTable/DataTableSearchClient';
import { Metadata } from 'next';
import { getPaginatedUsers } from '@/db/drizzle/queries/users';
import { SkeletonUsersTable, UsersTable } from '@/components/users/table';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'All Orders',
};

type SearchParams = Promise<{
  page?: string;
  sort?: `${string}.${'asc' | 'desc'}`;
  search?: string;
  perPage?: string;
}>;

export default function UsersPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <Suspense
      fallback={
        <div className="m-4">
          <Heading size={'h3'} as={'h1'} className="mb-4">
            Users
          </Heading>
          <DataTableSearchClient />
          <SkeletonUsersTable />
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

  const result = await getPaginatedUsers(pageNum, perPage, sortKey, sortDir, search);
  if (result instanceof AppError) {
    return (
      <div className="p-4">
        <Heading size={'h3'} as={'h1'}>
          Error loading users
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
          Users
        </Heading>
        <Link href="users/new">
          <Button variant={'addition'}>
            <PlusIcon /> Add User
          </Button>
        </Link>
      </div>
      <div className="">
        <DataTableSearchClient />
        <Suspense fallback={<SkeletonUsersTable />}>
          <UsersTable
            users={data}
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
