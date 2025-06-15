import { paginatedProductsType } from '@/drizzle/queries/products';
import { formatDateTime } from '@/lib/utils';
import { ProductTableHeader } from './product-table-header';
import { ProductTableBody } from './product-table-body';
import { ProductTableFooter } from './product-table-footer';

type ProductDataTableProps = {
  data: paginatedProductsType[];
  page: number;
  pageSize: number;
  total: number;
  sortKey: string;
  sortDirection: 'asc' | 'desc';
  queryParams?: string;
  currentPage?: number;
};

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
    return product.categories ? Object.values(product.categories).join(', ') : '-';
  }

  if (field === 'createdAt') {
    return product.createdAt ? formatDateTime(product.createdAt) : '-';
  }

  if (value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return value.toString();
}

const columns: { key: string; label: string; sortable?: boolean }[] = [
  { key: 'id', label: '#', sortable: true },
  { key: 'name', label: 'Name', sortable: true },
  { key: 'sku', label: 'SKU', sortable: true },
  { key: 'sn', label: 'SN', sortable: true },
  { key: 'categories', label: 'Categories' },
  { key: 'price', label: 'Price', sortable: true },
  { key: 'deliveryPrice', label: 'Delivery Price', sortable: true },
  { key: 'quantity', label: 'Quantity', sortable: true },
  { key: 'createdAt', label: 'Created on', sortable: true },
  { key: 'actions', label: 'Actions' },
];

export function ProductDataTable({
  data,
  page,
  pageSize,
  total,
  sortKey,
  sortDirection,
  queryParams = '',
  currentPage = 1,
}: ProductDataTableProps) {
  // Calculate derived values
  const products = data;
  const stringParams = queryParams;
  const totalPages = Math.ceil(total / pageSize);
  const sortDir = sortDirection;

  return (
    <div className="w-full overflow-x-auto md:border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <ProductTableHeader sortKey={sortKey} sortDir={sortDir} columns={columns} />
        <ProductTableBody products={products} stringParams={stringParams} columns={columns} />
        <ProductTableFooter
          total={total}
          page={page}
          currentPage={currentPage}
          totalPages={totalPages}
          sortKey={sortKey}
          sortDir={sortDir}
        />
      </table>
    </div>
  );
}
