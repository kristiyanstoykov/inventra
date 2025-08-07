'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';

export function DataTableSearchControlsClient({}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  function handleSearch(term: string) {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }

    replace(`${pathname}?${params.toString()}`);
  }

  function clearSearch() {
    const params = new URLSearchParams(searchParams);
    params.delete('search');

    replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex items-center gap-2 py-2 max-w-md">
      <div className="flex items-center justify-between relative flex-1">
        <Input
          type="text"
          name="search"
          placeholder="Search..."
          defaultValue={searchParams.get('search')?.toString()}
          className="h-9 w-full pl-3 pr-10 py-1.5 border rounded-md text-sm"
          onChange={(e) => {
            handleSearch(e.target.value);
          }}
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          tabIndex={-1}
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
      <Button
        type="submit"
        name="clear"
        value="1"
        variant="destructive"
        className="h-9 text-sm"
        onClick={() => {
          clearSearch();
        }}
      >
        Clear
      </Button>
    </div>
  );
}
