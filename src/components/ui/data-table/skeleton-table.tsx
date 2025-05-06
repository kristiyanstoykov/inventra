import React from 'react';
import { cn } from '@/lib/utils';

type SkeletonTableProps = {
  columns: number; // number of columns
  rows?: number; // number of skeleton rows
  className?: string;
};

export function SkeletonTable({ columns, rows = 10, className }: SkeletonTableProps) {
  return (
    <div className={cn('w-full overflow-x-auto border rounded-md', className)}>
      <table className="min-w-full text-sm text-left border-collapse">
        <thead className="bg-muted">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-2 font-semibold border-b">
                <div className="h-4 w-24 bg-muted-foreground/30 rounded" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="animate-pulse">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="px-4 py-3 border-b">
                  <div className="h-4 w-full bg-muted-foreground/20 rounded" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
