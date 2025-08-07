import { Table } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Button } from '../ui/button';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  pagination: {
    total: number;
    pageNum: number;
    pageSize: number;
    pageCount: number;
    canPreviousPage: boolean;
    canNextPage: boolean;
  };
}

export function DataTablePagination<TData>({
  table,
  pagination,
}: DataTablePaginationProps<TData>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handlePageChange(page: number) {
    const params = new URLSearchParams(searchParams);
    params.set('page', String(page));
    replace(`${pathname}?${params.toString()}`);
  }

  function setPerPage(perPage: number) {
    const params = new URLSearchParams(searchParams);
    table.setPageSize(perPage);
    params.set('perPage', String(perPage));
    replace(`${pathname}?${params.toString()}`);
  }

  function handlePerPage(perPage: number) {
    const params = new URLSearchParams(searchParams);
    params.set('perPage', String(perPage));
    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex items-center space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Rows per page</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
              setPerPage(Number(value));
              handlePerPage(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 25, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pagination.pageNum} of {pagination.pageCount}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => handlePageChange(1)}
            disabled={!pagination.canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(pagination.pageNum - 1)}
            disabled={!pagination.canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => handlePageChange(pagination.pageNum + 1)}
            disabled={!pagination.canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => handlePageChange(pagination.pageCount)}
            disabled={!pagination.canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  );
}
