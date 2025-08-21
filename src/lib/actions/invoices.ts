'use server';

import { AppError } from '../appError';
import { createInvoice, getInvoiceById, getInvoiceByOrderId } from '@/db/drizzle/queries/invoices';
import { logger } from '../logger';

export async function handleInvoiceAction(orderId: number) {
  try {
    if (!orderId || isNaN(orderId)) {
      return new AppError('Invalid order ID', 'INVALID_ID');
    }

    const invoiceByOrderId = await getInvoiceByOrderId(orderId);

    if (invoiceByOrderId instanceof AppError) {
      return invoiceByOrderId;
    }

    if (invoiceByOrderId) {
      return {
        error: false,
        message: 'Invoice found. redirecting...',
        invoiceNumber: invoiceByOrderId.id,
        fileUrl: invoiceByOrderId.fileUrl,
        fileName: invoiceByOrderId.fileName,
        downloadUrl: `${invoiceByOrderId.fileUrl}?download=1`,
      };
    }

    // Build PDF using streaming approach
    const invoiceId = await createInvoice(orderId, { createdAt: new Date() });

    if (invoiceId instanceof AppError) {
      return invoiceId;
    }

    const invoice = await getInvoiceById(invoiceId);

    if (null === invoice) {
      throw new Error(`Invoice #${invoiceId} not found`);
    }
    if (invoice instanceof AppError) {
      return invoice;
    }

    if (!invoice.fileUrl) {
      throw new Error(`Invoice #${invoiceId} does not have a file URL`);
    }

    const downloadUrl = `${invoice.fileUrl}?download=1`;

    return {
      error: false,
      message: 'Successfully generated invoice',
      invoiceNumber: invoiceId,
      fileName: invoice.fileName,
      fileUrl: invoice.fileUrl,
      downloadUrl,
    };
  } catch (error) {
    logger.logError(error, 'GENERATE_INVOICE');
    const message = error instanceof Error ? error.message : 'Failed to generate invoice';
    return new AppError(message, 'GENERATE_FAILED');
  }
}
