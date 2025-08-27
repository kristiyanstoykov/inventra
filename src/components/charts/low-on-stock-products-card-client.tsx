import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { getOutOfStockProducts } from '@/db/drizzle/queries/products';
import { AppError } from '@/lib/appError';
import { Separator } from '@radix-ui/react-separator';
import Link from 'next/link';

export function LowOnStockProductsCardClient({
  items,
}: {
  items: Awaited<ReturnType<typeof getOutOfStockProducts>>;
}) {
  if (!items) return null;

  if (items instanceof AppError) {
    return (
      <Card className="min-w-[350px] max-w-[350px] flex flex-col">
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{items.toString()}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="min-w-[350px] max-w-[350px] flex flex-col shadow-primary">
      <CardHeader>
        <CardTitle className="flex flex-row items-baseline gap-1">
          {/* Status dot */}
          <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-primary mt-1 shrink-0" />
          Low on stock products
        </CardTitle>
        <CardDescription>
          {items.length > 0
            ? items.length === 1
              ? `${items.length} product low on stock`
              : `${items.length} products low on stock`
            : 'No products low on stock'}
        </CardDescription>
      </CardHeader>
      <Separator className="border border-t-1 pb-0" />
      <CardContent className="flex-1 p-0 overflow-y-auto max-h-[350px]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-[150px] text-muted-foreground text-sm">
            No products low on stock
          </div>
        ) : (
          <ol className="list-none m-0 p-0 w-full">
            {items.map((item) => (
              <li key={item.id} className="ps-6 pb-2 pt-2 hover:bg-muted/90 transition-colors">
                <div className="flex flex-col flex-nowrap gap-1">
                  <div className="text-sm flex flex-row items-baseline gap-1">
                    {/* Product ID */}
                    <span className="tabular-nums font-semibold">#{item.id}</span>
                    {item.name}
                  </div>
                  {/* SKU or SN */}
                  <span className="text-muted-foreground text-xs">
                    {item.sku || item.sn || '—'}
                  </span>
                  {/* View button */}
                  <Link
                    href={`/admin/products/edit/${item.id}`}
                    className="text-primary hover:underline text-xs font-medium"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
      <Separator className="border border-t-1" />

      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span>Total: {items.length}</span>
        <Link href="/admin/products" className="hover:underline text-primary font-medium">
          Manage Products →
        </Link>
      </CardFooter>
    </Card>
  );
}
