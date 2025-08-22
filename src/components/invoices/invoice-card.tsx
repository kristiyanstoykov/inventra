import { InferSelectModel } from 'drizzle-orm';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Eye, Download } from 'lucide-react';
import { InvoicesTable } from '@/db/drizzle/schema';
import Link from 'next/link';

export function InvoiceCard(invoice: InferSelectModel<typeof InvoicesTable>) {
  return (
    <Card className="max-w-[350px] aspect-square flex flex-col m-auto md:m-0">
      <CardContent className="flex-1 p-6">
        <p>Invoice #{invoice.id}</p>
        <p>Order #{invoice.orderId}</p>
      </CardContent>

      <CardFooter className="mt-auto p-4 pt-0 flex gap-2">
        <Link href={`/admin/invoices/${invoice.fileName}`}>
          <Button variant="secondary" className="flex-1">
            <Eye className="mr-2 h-4 w-4" />
            View
          </Button>
        </Link>
        <Button className="flex-1">
          <Download className="mr-2 h-4 w-4" />
          Download
        </Button>
      </CardFooter>
    </Card>
  );
}
