import { AppError } from '@/lib/appError';
import { AttributeTableHeader } from './attribute-table-header';
import { AttributeTableFooter } from './attribute-table-footer';
import { AttributeTableBody } from './attribute-table-body';
import { columns, getPaginatedAttributes } from '@/drizzle/queries/attributes';

export async function AttributeDataTable({
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
  const result = await getPaginatedAttributes(page, pageSize, sortKey, sortDirection, search);

  if (result instanceof AppError) {
    return <div className="text-destructive">Error: {result.message}</div>;
  }

  const { data: attributes, total } = result;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="w-full overflow-x-auto md:border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <AttributeTableHeader sortKey={sortKey} sortDir={sortDirection} columns={columns} />
        <AttributeTableBody attributes={attributes} columns={columns} />
        <AttributeTableFooter
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
