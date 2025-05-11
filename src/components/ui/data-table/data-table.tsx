// src/components/ui/data-table/data-table.tsx
import Link from 'next/link';
import { headers } from 'next/headers';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

type Column<T> = {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
};

type DataTableProps<T> = {
  columns: Column<T>[];
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
};

export async function DataTable<T>({
  columns,
  data,
  page,
  pageSize,
  total,
  sortKey,
  sortDirection,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);
  const headerList = await headers();
  const pathname = headerList.get('x-current-path');

  const buildUrl = (options: { page?: number; sortKey?: string; sortDir?: 'asc' | 'desc' }) => {
    const params = new URLSearchParams();
    if (options.page) params.set('page', String(options.page));
    if (options.sortKey) params.set('sortKey', options.sortKey);
    if (options.sortDir) params.set('sortDir', options.sortDir);
    return `${pathname}?${params.toString()}`;
  };

  return (
    <div className="w-full overflow-x-auto border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => {
              const isSorted = sortKey === col.key;
              const nextDir = isSorted && sortDirection === 'asc' ? 'desc' : 'asc';

              return (
                <th
                  key={String(col.key)}
                  className={cn(
                    'px-4 py-2 font-semibold border',
                    col.sortable ? 'hover:bg-accent cursor-pointer' : ''
                  )}
                >
                  {col.sortable ? (
                    <Link
                      href={buildUrl({
                        page: 1,
                        sortKey: String(col.key),
                        sortDir: nextDir,
                      })}
                      className="flex items-center gap-1"
                    >
                      {col.label}
                      {isSorted && <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>}
                    </Link>
                  ) : (
                    col.label
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
                No data available
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-muted/50 transition-colors">
                {columns.map((col) => (
                  <td key={String(col.key)} className="px-4 py-2 border">
                    {col.render
                      ? col.render(row)
                      : // Check if the value is an array or object (e.g., categories)
                        (Array.isArray((row as never)[col.key]) ||
                            typeof (row as never)[col.key] === 'object') &&
                          (row as never)[col.key]
                        ? // Render array or object as a comma-separated string
                          Object.values((row as never)[col.key])
                            .map((value) => String(value))
                            .join(', ')
                        : // Default rendering for simple values or empty categories
                          String((row as never)[col.key] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination & Summary */}
      <div className="flex flex-col sm:flex-row justify-between items-center p-4 text-sm">
        <div className="text-foreground mb-2 sm:mb-0">
          Total items: <span className="font-medium">{total}</span>
        </div>
        <div className="flex items-center space-x-2">
          {page > 1 ? (
            <Link
              href={buildUrl({ page: page - 1, sortKey, sortDir: sortDirection })}
              className="p-2 border rounded hover:bg-muted transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 border rounded text-muted-foreground cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" />
            </span>
          )}

          <span>
            Page <span className="font-medium">{page}</span> of{' '}
            <span className="font-medium">{totalPages}</span>
          </span>

          {page < totalPages ? (
            <Link
              href={buildUrl({ page: page + 1, sortKey, sortDir: sortDirection })}
              className="p-2 border rounded hover:bg-muted transition"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          ) : (
            <span className="p-2 border rounded text-muted-foreground cursor-not-allowed">
              <ChevronRight className="w-4 h-4" />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
