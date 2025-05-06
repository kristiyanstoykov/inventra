'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  loading?: boolean;
  sortKey?: string;
  sortDirection?: 'asc' | 'desc';
  onSortChange?: (key: string, direction: 'asc' | 'desc') => void;
  onPageChange?: (page: number) => void;
};

export function DataTable<T>({
  columns,
  data,
  page,
  pageSize,
  total,
  loading = false,
  sortKey,
  sortDirection,
  onSortChange,
  onPageChange,
}: DataTableProps<T>) {
  const totalPages = Math.ceil(total / pageSize);

  const handleSort = (key: string) => {
    if (!onSortChange) return;
    const direction = sortKey === key && sortDirection === 'asc' ? 'desc' : 'asc';
    onSortChange(key, direction);
  };

  const renderSkeleton = () => (
    <tbody>
      {Array.from({ length: pageSize }).map((_, rowIdx) => (
        <tr key={rowIdx} className="animate-pulse">
          {columns.map((_, colIdx) => (
            <td key={colIdx} className="px-4 py-3 border-b">
              <div className="h-4 w-full bg-muted-foreground/20 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );

  const renderRows = () =>
    data.length === 0 ? (
      <tr>
        <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
          No data available
        </td>
      </tr>
    ) : (
      data.map((row, rowIndex) => (
        <tr key={rowIndex} className="hover:bg-muted/50 transition-colors">
          {columns.map((col) => (
            <td key={String(col.key)} className="px-4 py-2 border-b">
              {col.render ? col.render(row) : String(row[col.key as keyof T] ?? '')}
            </td>
          ))}
        </tr>
      ))
    );

  return (
    <div className="w-full overflow-x-auto border rounded-md">
      <table className="min-w-full text-sm text-left border-collapse" aria-busy={loading}>
        <thead className="bg-muted">
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                onClick={() => col.sortable && handleSort(String(col.key))}
                className={cn(
                  'px-4 py-2 font-semibold border-b cursor-pointer select-none',
                  col.sortable ? 'hover:bg-accent' : 'cursor-default'
                )}
              >
                <div className="flex items-center gap-1">
                  {col.label}
                  {col.sortable && sortKey === col.key && (
                    <span>{sortDirection === 'asc' ? '▲' : '▼'}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        {loading ? renderSkeleton() : <tbody>{renderRows()}</tbody>}
      </table>

      {/* Pagination */}
      <div className="flex justify-between items-center p-4 text-sm text-muted-foreground">
        <div>
          Page {page} of {totalPages}
        </div>
        <div className="space-x-2">
          <Button
            disabled={page === 1}
            onClick={() => onPageChange?.(page - 1)}
            variant="outline"
            className="px-3 py-1"
          >
            Previous
          </Button>
          <Button
            disabled={page === totalPages}
            onClick={() => onPageChange?.(page + 1)}
            variant="outline"
            className="px-3 py-1"
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
