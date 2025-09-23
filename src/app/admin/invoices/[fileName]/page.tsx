import React, { Suspense } from 'react';
import { Metadata } from 'next';
import { getInvoiceByFileName } from '@/db/drizzle/queries/invoices';
import { Heading } from '@/components/ui/heading';
import { ArrowLeft, Download, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { notFound } from 'next/navigation';
import PdfViewer from '@/components/PdfViewer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = {
  title: 'Invoice',
};
interface InvoicePageProps {
  params: Promise<{
    fileName: string;
  }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  return (
    <Suspense
      fallback={
        <div className="m-4">
          <Heading size={'h3'} as={'h1'} className="mb-4">
            Invoice <Loader2 className="ms-1 inline animate-spin" />
          </Heading>
        </div>
      }
    >
      <SuspendedPage params={params} />
    </Suspense>
  );
}

async function SuspendedPage({ params }: InvoicePageProps) {
  const { fileName } = await params;

  const invoice = await getInvoiceByFileName(fileName);

  // Not found
  if (invoice == null) {
    notFound();
  }

  // Error (AppError)
  if (invoice instanceof Error) {
    return (
      <div className="m-4">
        <Heading size={'h3'} as={'h1'} className="mb-4">
          There was an error while getting invoice {`#${fileName}`}
        </Heading>
        <pre>{JSON.stringify(invoice, null, 2)}</pre>
      </div>
    );
  }

  const pdfUrl = invoice.fileUrl
    ? invoice.fileUrl.startsWith('/admin')
      ? invoice.fileUrl
      : `/admin${invoice.fileUrl}`
    : null;

  const pdfUrlCopy = invoice.fileName ? `/admin/media/invoices/${invoice.fileName}-copy.pdf` : null;

  return (
    <div className="m-4">
      <div className="w-[95%] max-w-full text-left mb-4">
        <Heading size="h3" as="h1" className="mb-4">
          Invoice #{invoice.id}
        </Heading>
        <Link href="/admin/orders/" className="text-blue-600 underline hover:text-blue-800">
          <ArrowLeft className="inline h-4" /> Go back to orders
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* ОРИГИНАЛ */}
        <Card className="overflow-hidden">
          <CardHeader>
            <Heading size="h4" as="h2">
              Original invoice
            </Heading>
          </CardHeader>
          <CardContent>
            {!pdfUrl ? (
              <p className="text-sm text-muted-foreground">No PDF found</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Link
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 mb-3 inline-block text-sm underline"
                  >
                    <Button variant="default">Open PDF in new tab</Button>
                  </Link>
                  <Link
                    href={`${pdfUrl}?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 mb-3 inline-block text-sm underline"
                  >
                    <Button
                      variant="secondary"
                      className="border border-blue-200 bg-blue-100 hover:bg-blue-300 dark:text-black dark:border-blue-400 dark:bg-blue-300 dark:hover:bg-blue-100"
                    >
                      <Download className="me-1 size-4" />
                      Download
                    </Button>
                  </Link>
                </div>

                <PdfViewer url={pdfUrl} />
              </>
            )}
          </CardContent>
        </Card>

        {/* КОПИЕ */}
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <Heading size="h4" as="h2">
              Copy of invoice
            </Heading>
          </CardHeader>
          <CardContent>
            {!pdfUrlCopy ? (
              <p className="text-sm text-muted-foreground">No PDF found</p>
            ) : (
              <>
                <div className="flex gap-2">
                  <Link
                    href={pdfUrlCopy}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 mb-3 inline-block text-sm underline"
                  >
                    <Button variant="default">Open PDF in new tab</Button>
                  </Link>
                  <Link
                    href={`${pdfUrl}?download=1`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 mb-3 inline-block text-sm underline"
                  >
                    <Button
                      variant="secondary"
                      className="border border-blue-200 bg-blue-100 hover:bg-blue-300 dark:text-black dark:border-blue-400 dark:bg-blue-300 dark:hover:bg-blue-100"
                    >
                      <Download className="me-1 size-4" />
                      Download
                    </Button>
                  </Link>
                </div>

                <PdfViewer url={pdfUrlCopy} />
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
