import { columns, getPaginatedProducts, paginatedProductsType } from '@/drizzle/queries/products';
import { AppError } from '@/lib/appError';
import { ProductTableHeader } from './product-table-header';
import { ProductTableBody } from './product-table-body';
import { ProductTableFooter } from './product-table-footer';
import { empty } from '@/lib/empty';
import { formatDateTime } from '@/lib/utils';

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

export function formatFieldValue(
  product: paginatedProductsType,
  field: keyof paginatedProductsType
): React.ReactNode {
  const value = product[field];

  if (field === 'categories') {
    if (empty(product.categories)) {
      return '-';
    }
    return product.categories ? Object.values(product.categories).join(', ') : '-';
  }

  if (field === 'createdAt') {
    return product.createdAt ? formatDateTime(product.createdAt) : '-';
  }

  if (empty(value) || value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return value.toString();
}

export async function ProductDataTable({
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
  const productsPerPage = 50;
  const result = await getPaginatedProducts(page, productsPerPage, sortKey, sortDirection, search);

  if (result instanceof AppError) {
    return <div className="text-red-500 p-4">Error loading products: {result.toString()}</div>;
  }

  const { data: products, total, pageSize } = result;
  const currentPage = Math.min(page, Math.ceil(total / pageSize));

  return (
    <div className="w-full overflow-x-auto md:border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <ProductTableHeader
          queryParams={queryParams}
          sortKey={sortKey}
          sortDir={sortDirection}
          columns={columns}
        />
        <ProductTableBody products={products} columns={columns} stringParams={queryParams} />
        <ProductTableFooter
          queryParams={queryParams}
          total={total}
          page={page}
          currentPage={currentPage}
          totalPages={Math.ceil(total / pageSize)}
          sortKey={sortKey}
          sortDir={sortDirection}
        />
      </table>
    </div>
  );
}
