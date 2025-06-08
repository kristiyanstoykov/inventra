import { CardTitle } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Spacer } from '@/components/ui/spacer';
import { CategoryForm } from './components/CategoryForm';
import { getPaginatedCategories } from '@/drizzle/queries/categories';
import { DataTable } from '@/components/ui/data-table/data-table';
import { AppError } from '@/lib/appError';

type ProductsPageProps = {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
  }>;
};

export default async function CategoriesPage({ searchParams }: ProductsPageProps) {
  let errorMessage = '';
  const params = await searchParams;

  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const productsPerPage = 10;

  const result = await getPaginatedCategories(page, productsPerPage, sortKey, sortDir);
  if (result instanceof AppError) {
    errorMessage = result.message;
    return <div>Error: {result.message}</div>;
  }
  const { data: categories, total, pageSize } = result;

  return (
    <div>
      <Heading size="h3">Product categories</Heading>
      <Spacer size="sm" />
      <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-4">
        {/* Column 1 */}
        <div className="flex flex-col gap-4  items-stretch">
          <CardTitle>Add new category</CardTitle>
          <CategoryForm />
        </div>
        {/* Column 2 */}
        <div className="p-4 rounded">
          {/* Table */}
          {errorMessage && (
            <p className="mb-4 text-sm font-medium text-destructive">{errorMessage}</p>
          )}
          <DataTable
            columns={[
              { key: 'id', label: '#', sortable: true },
              { key: 'name', label: 'Name', sortable: true },
              { key: 'slug', label: 'Slug', sortable: true },
            ]}
            data={categories}
            page={page}
            pageSize={pageSize}
            total={total}
            sortKey={sortKey}
            sortDirection={sortDir}
          />
        </div>
      </div>
    </div>
  );
}
