import { handleInvoiceAction } from '@/lib/actions/invoices';
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { empty } from '@/lib/empty';

export async function handleInvoice(orderId: number, router: AppRouterInstance) {
  try {
    const res = await handleInvoiceAction(orderId);

    if (res instanceof Error) {
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
    const msg = error instanceof Error ? error.message : 'Failed to generate invoice';
    return { error: true, message: msg };
  }
}
