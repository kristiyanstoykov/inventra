import { buildUrl, cn } from '@/lib/utils';
import { Column } from './product-data-table';

export function ProductTableHeader({
  queryParams,
  sortKey,
  sortDir,
  columns,
}: {
  queryParams: string;
  sortKey: string;
  sortDir: 'asc' | 'desc';
  columns: Column[];
}) {
  return (
    <thead className="bg-muted hidden md:table-header-group">
      <tr>
        {columns.map((col) => {
          const isSorted = sortKey === col.key;
          const nextDir = isSorted && sortDir === 'asc' ? 'desc' : 'asc';
          const content = col.sortable ? (
            <a
              href={buildUrl({ sortKey: col.key, sortDir: nextDir }, queryParams)}
              className={`flex items-center gap-1 transition-colors ${
                isSorted ? 'text-primary font-semibold' : 'text-foreground hover:text-primary'
              }`}
            >
              {col.label}
              {isSorted && <span>{sortDir === 'asc' ? '▲' : '▼'}</span>}
            </a>
          ) : (
            col.label
          );

          return (
            <th
              key={col.key}
              className={cn(
                'px-4 py-2 font-semibold border whitespace-nowrap',
                col.sortable && 'hover:bg-muted-foreground/20 cursor-pointer'
              )}
            >
              {content}
            </th>
          );
        })}
      </tr>
    </thead>
  );
}
