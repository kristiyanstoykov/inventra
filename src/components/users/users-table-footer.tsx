import { ChevronLeft, ChevronRight } from 'lucide-react';
import { buildUrl } from '@/lib/utils';

export function UsersTableFooter({
  queryParams,
  total,
  page,
  currentPage,
  totalPages,
  sortKey,
  sortDir,
}: {
  queryParams: string;
  total: number;
  page: number;
  currentPage: number;
  totalPages: number;
  sortKey: string;
  sortDir: 'asc' | 'desc';
}) {
  return (
    <tfoot>
      <tr>
        <td colSpan={100}>
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 text-sm">
            <div className="text-foreground mb-2 sm:mb-0">
              Total items: <span className="font-medium">{total}</span>
            </div>
            <div className="flex items-center space-x-2">
              {page > 1 ? (
                <a
                  href={buildUrl({ page: page - 1, sortKey, sortDir }, queryParams)}
                  className="p-2 border rounded hover:bg-muted transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </a>
              ) : (
                <span className="p-2 border rounded text-muted-foreground cursor-not-allowed">
                  <ChevronLeft className="w-4 h-4" />
                </span>
              )}
              <span>
                Page <span className="font-medium">{currentPage}</span> of{' '}
                <span>{totalPages === 0 ? 1 : totalPages}</span>
              </span>
              {currentPage < totalPages ? (
                <a
                  href={buildUrl({ page: page + 1, sortKey, sortDir }, queryParams)}
                  className="p-2 border rounded hover:bg-muted transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </a>
              ) : (
                <span className="p-2 border rounded text-muted-foreground cursor-not-allowed">
                  <ChevronRight className="w-4 h-4" />
                </span>
              )}
            </div>
          </div>
        </td>
      </tr>
    </tfoot>
  );
}
