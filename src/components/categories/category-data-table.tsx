import { getPaginatedCategories } from '@/drizzle/queries/categories';
import { AppError } from '@/lib/appError';
import { CategoryTableHeader } from './category-table-header';
import { CategoryTableFooter } from './category-table-footer';
import { CategoryTableBody } from './category-table-body';

export async function CategoryDataTable({
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
  const result = await getPaginatedCategories(page, pageSize, sortKey, sortDirection, search);

  if (result instanceof AppError) {
    return <div className="text-destructive">Error: {result.message}</div>;
  }

  const { data: categories, total } = result;
  const totalPages = Math.ceil(total / pageSize);
  const currentPage = Math.min(page, totalPages);
  const columns = [
    { key: 'id', label: '#', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'slug', label: 'Slug', sortable: true },
    { key: 'actions', label: 'Actions' },
  ];

  return (
    <div className="w-full overflow-x-auto md:border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <CategoryTableHeader sortKey={sortKey} sortDir={sortDirection} columns={columns} />
        <CategoryTableBody categories={categories} columns={columns} />
        <CategoryTableFooter
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
