import { Column } from '@tanstack/react-table';
import { ArrowDown, ArrowUp, ChevronsUpDown, XIcon } from 'lucide-react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';

interface DataTableSortableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableSortableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableSortableColumnHeaderProps<TData, TValue>) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  function handleSort(term: string, direction: 'asc' | 'desc') {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('sort', `${term}.${direction}`);
    } else {
      params.delete('sort');
    }

    replace(`${pathname}?${params.toString()}`);
  }

  function clearSort() {
    const params = new URLSearchParams(searchParams);
    params.delete('sort');
    replace(`${pathname}?${params.toString()}`);
  }

  // Parse sort and search from URL search params
  const sortParam = searchParams.get('sort');
  const [sortKey = '', sortDir = ''] =
    (sortParam?.split('.') as [string, 'asc' | 'desc']) ?? [];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className="data-[state=open]:bg-accent -ml-3 h-8 hover:bg-primary/10 dark:hover:bg-primary/20"
          >
            <span>{title}</span>
            {column.id === sortKey ? (
              sortDir === 'desc' ? (
                <ArrowDown />
              ) : sortDir === 'asc' ? (
                <ArrowUp />
              ) : (
                <ChevronsUpDown />
              )
            ) : (
              <ChevronsUpDown />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => handleSort(column.id, 'asc')}>
            <ArrowUp />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSort(column.id, 'desc')}>
            <ArrowDown />
            Desc
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => clearSort()}>
            <XIcon />
            Clear
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
