import { Heading } from '@/components/ui/heading';
import { Card, CardContent } from '@/components/ui/card';
import { Metadata } from 'next';
import { Suspense } from 'react';
import { AppError } from '@/lib/appError';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getInvoices } from '@/db/drizzle/queries/invoices';
import { InvoiceCard } from '@/components/invoices/invoice-card';
export const metadata: Metadata = {
  title: 'Settings',
};

export default function SettingsPage() {
  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Suspense fallback={<LoadingSpinner className="absolute inset-0 m-auto loading-spinner" />}>
        <SuspendedPage />
      </Suspense>
    </div>
  );
}

async function SuspendedPage() {
  const invoices = await getInvoices();

  if (invoices instanceof AppError) {
    return (
      <div className="container p-4 w-full">
        <Heading size={'h3'} as={'h1'} className="mb-4">
          Error loading invoices
        </Heading>

        <Card className="w-full">
          <CardContent>{JSON.stringify(invoices, null, 2)}</CardContent>
        </Card>
      </div>
    );
  }

  if (null == invoices) {
    return (
      <div className="container p-4 w-full">
        <Heading size={'h3'} as={'h1'} className="mb-4">
          No invoices found
        </Heading>

        <Card className="w-full">
          <CardContent></CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container p-4 w-full">
      <Heading size={'h3'} as={'h1'} className="mb-4">
        All invoices
      </Heading>

      <div className="flex flex-wrap gap-4 overflow-x-auto">
        {invoices.map((invoice) => (
          <InvoiceCard key={invoice.id} {...invoice} />
        ))}
      </div>
    </div>
  );
}
