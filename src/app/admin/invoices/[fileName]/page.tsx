import React from 'react';
import { Metadata } from 'next';
import { getInvoiceByFileName } from '@/db/drizzle/queries/invoices';

export const metadata: Metadata = {
  title: 'Invoice',
};
interface InvoicePageProps {
  params: Promise<{
    fileName: string;
  }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { fileName } = await params;

  const invoice = await getInvoiceByFileName(fileName);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Invoice</h1>
      <p>
        File Name: <strong>{fileName}</strong>
      </p>
      <pre>{JSON.stringify(invoice, null, 2)}</pre>
    </main>
  );
}
