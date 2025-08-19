import { useState } from 'react';
import { toast } from 'sonner';
import { AppError } from '@/lib/appError';
import { generateInvoiceAction } from '@/lib/actions/invoices';

export function useInvoiceDownload() {
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  async function handleInvoice(id: number) {
    try {
      setDownloadingId(id);

      const res = await generateInvoiceAction(id);

      // AppError or { error: true }
      if (res instanceof AppError || (res && (res as any).error)) {
        const msg = res instanceof AppError ? res.message : (res as any).message || 'Failed';
        toast.error(msg);
        return res;
      }

      const { invoiceNumber, fileUrl, downloadUrl } = res as {
        invoiceNumber: string;
        fileUrl: string;
        downloadUrl?: string;
      };

      // Prefer server-side Content-Disposition (?download=1)
      const href = downloadUrl ?? `${fileUrl}?download=1`;

      // Trigger download without popup blockers
      const a = document.createElement('a');
      a.href = href;
      a.download = ''; // let server filename win
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();

      return { ...res, message: `Invoice #${invoiceNumber} generated` };
    } finally {
      setDownloadingId(null);
    }
  }

  return { handleInvoice, downloadingId };
}
