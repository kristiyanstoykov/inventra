import { Heading } from '@/components/ui/heading';
import { Spacer } from '@/components/ui/spacer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AttributeForm } from '../../../../components/attributes/attribute-add-form';
import { AttributeDataTable } from '@/components/attributes/attribute-data-table';
import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { DataTableSearchControls } from '@/components/ui/data-table/data-table-search-controls';

export default async function AttributesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    sortKey?: string;
    sortDir?: 'asc' | 'desc';
    search?: string;
  }>;
}) {
  const params = await searchParams;
  const stringParams = new URLSearchParams({ ...params }).toString();
  const page = parseInt(params.page ?? '1', 10) || 1;
  const sortKey = params.sortKey ?? 'createdAt';
  const sortDir = params.sortDir === 'asc' ? 'asc' : 'desc';
  const search = params.search ?? '';

  return (
    <>
      <Heading size="h3" as="h1">
        Product attributes
      </Heading>
      <Spacer size="sm" />
      <div className="grid grid-cols-1 md:grid-cols-[30%_1fr] gap-4 mt-4">
        <div className="flex flex-col gap-4 items-stretch mt-2">
          <Card className="max-w-[500px]">
            <CardHeader>
              <CardTitle>Add new attribute</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <AttributeForm />
            </CardContent>
          </Card>
        </div>
        <div className="">
          <DataTableSearchControls search={search} queryParams={stringParams} />
          <Suspense
            fallback={
              <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                Loading attributes... <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            }
          >
            <AttributeDataTable
              search={search}
              queryParams={stringParams}
              page={page}
              sortKey={sortKey}
              sortDirection={sortDir}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
