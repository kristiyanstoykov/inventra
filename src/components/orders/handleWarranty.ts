import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { empty } from '@/lib/empty';
import { handleWarrantyAction } from '@/lib/actions/warranties';

export async function handleWarranty(orderId: number, router: AppRouterInstance) {
  try {
    const res = await handleWarrantyAction(orderId);

    if (res instanceof Error) {
      throw res;
    }

    if (res.error) {
      throw new Error(res.message);
    }

    if (empty(res.invoiceNumber)) {
      throw new Error('Failed to generate warranty');
    }

    const url = `/admin/${res.downloadUrl}`;
    // Prefetch for faster load (non-blocking)
    try {
      if (typeof router.prefetch === 'function') {
        router.prefetch(url);
      }
    } catch {}

    window.open(url, '_blank', 'noopener,noreferrer');

    return { ...res };
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Failed to generate warranty';
    return { error: true, message: msg };
  }
}
