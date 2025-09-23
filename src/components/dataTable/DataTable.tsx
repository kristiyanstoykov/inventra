'use client';

import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ReactNode, useState } from 'react';
import { DataTablePagination } from './DataTablePagination';

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  initialFilters?: ColumnFiltersState;
  noResultsMessage?: ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  initialFilters,
  noResultsMessage = 'No results.',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: DataTableProps<TData, TValue> & {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>(
    initialFilters ?? []
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    state: {
      sorting,
      columnFilters,
      pagination: {
        pageIndex: page,
        pageSize: pageSize,
      },
    },
    manualPagination: true,
    pageCount: totalPages,
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader className="bg-sidebar">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="border-1">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {noResultsMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        pagination={{
          total: total,
          pageNum: page,
          pageSize: pageSize,
          pageCount: totalPages,
          canPreviousPage: page > 1,
          canNextPage: page < totalPages,
        }}
      />
    </div>
  );
}
