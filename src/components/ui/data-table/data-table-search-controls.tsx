import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { searchAction } from '@/app/admin/products/actions';

export function DataTableSearchControls({
  search,
  queryParams,
}: {
  search: string;
  queryParams: string;
}) {
  return (
    <form action={searchAction} className="flex items-center justify-between gap-2 py-2 max-w-md">
      <input type="hidden" name="searchParams" value={queryParams} />
      <div className="relative w-full max-w-sm">
        <Input
          type="text"
          name="search"
          placeholder="Search..."
          defaultValue={search}
          className="h-9 w-full pl-3 pr-10 py-1.5 border rounded-md text-sm"
          // Ensure the input is not type="search" with preventDefault, and is not disabled
        />
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2"
          tabIndex={-1} // Prevents double submit on Enter
        >
          <Search className="w-4 h-4" />
        </Button>
      </div>
      {/* Clear button submits with clear flag */}
      <Button type="submit" name="clear" value="1" variant="destructive" className="h-9 text-sm">
        Clear
      </Button>
    </form>
  );
}
