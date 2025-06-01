import { DataTable } from '@/components/ui/data-table/data-table';
import { AppError } from '@/lib/appError';
import { getPaginatedUsers } from '@/drizzle/queries/users';

type UsersPageProps = {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  }>;
};

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams;

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'id';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const productsPerPage = 10;

  const result = await getPaginatedUsers(page, productsPerPage, sortKey, sortDir);
  if (result instanceof AppError) {
    return <div>Error: {result.toString()}</div>;
  }

  const { data: users, total, pageSize } = result;

  return (
    <DataTable
      columns={[
        { key: 'id', label: '#', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        { key: 'firstName', label: 'First name', sortable: true },
        { key: 'lastName', label: 'Last name', sortable: true },
        { key: 'phone', label: 'Phone', sortable: true },
        { key: 'address', label: 'Address', sortable: true },
        { key: 'companyName', label: 'Company name', sortable: true },
        { key: 'bulstat', label: 'Bulstat', sortable: true },
        { key: 'vatNumber', label: 'VAT number', sortable: true },
        { key: 'createdAt', label: 'Created at', sortable: true },
      ]}
      data={users}
      page={page}
      pageSize={pageSize}
      total={total}
      sortKey={sortKey}
      sortDirection={sortDir}
    />
  );
}
