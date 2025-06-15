import { AppError } from '@/lib/appError';
import { UsersTableHeader } from './users-table-header';
import { UsersTableBody } from './users-table-body';
import { UsersTableFooter } from './users-table-footer';
import { columns, getPaginatedUsers } from '@/drizzle/queries/users';

export async function UsersDataTable({
  page,
  sortKey,
  sortDirection,
  search,
  queryParams,
}: {
  page: number;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  search: string;
  queryParams: string;
}) {
  const pageSize = 10;
  const result = await getPaginatedUsers(page, pageSize, sortKey, sortDirection, search);

  if (result instanceof AppError) {
    return <div className="text-destructive">Error: {result.message}</div>;
  }

  const { data: users, total } = result;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="w-full overflow-x-auto md:border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <UsersTableHeader
          sortKey={sortKey}
          sortDir={sortDirection}
          columns={columns}
          queryParams={queryParams}
        />
        <UsersTableBody users={users} columns={columns} />
        <UsersTableFooter
          queryParams={queryParams}
          total={total}
          page={page}
          currentPage={currentPage}
          totalPages={totalPages}
          sortKey={sortKey}
          sortDir={sortDirection}
        />
      </table>
    </div>
  );
}
