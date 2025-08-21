import { toast } from 'sonner';
import { AppError } from '@/lib/appError';
import { handleInvoiceAction } from '@/lib/actions/invoices';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { empty } from '@/lib/empty';

export async function handleInvoice(orderId: number, router: AppRouterInstance) {
  try {
    const res = await handleInvoiceAction(orderId);

    if (res instanceof AppError) {
      const msg =
        res instanceof AppError
          ? res.message
          : // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (res as any).message || 'Failed to generate invoice';
      toast.error(msg);
      throw res;
    }

    if (res.error) {
      throw new Error(res.message);
    }

    if (empty(res.invoiceNumber)) {
      throw new Error('Failed to generate invoice');
    }

    const fileName = res.fileName;
    const url = `/admin/invoices/${encodeURIComponent(fileName)}`;
    // Prefetch for faster load (non-blocking)
    try {
      if (typeof router.prefetch === 'function') {
        router.prefetch(url);
      }
    } catch {}

    window.open(url, '_blank', 'noopener,noreferrer');

    return { ...res };
  } catch (error) {
    const msg = error instanceof AppError ? error.message : 'Failed to generate invoice';
    return { error: true, message: msg };
  }
}
