'use server';

import { AppError } from '../appError';
import { logger } from '../logger';
import { getOrderById } from '@/db/drizzle/queries/orders';
import { getUserById } from '@/db/drizzle/queries/users';
import { getOptionsFormRecords } from '@/db/drizzle/queries/options';
import { buildWarrantyPdfStream } from '../pdf/warranty';
import { generateRandomPassword } from '@/auth/core/passwordHasher';

export async function handleWarrantyAction(orderId: number) {
  try {
    if (!orderId || isNaN(orderId)) {
      return new AppError('Invalid order ID', 'INVALID_ID');
    }

    const order = await getOrderById(orderId);

    if (!order) throw new Error(`Order #${orderId} not found`);

    if (order instanceof AppError) {
      throw new Error(order.toString());
    }

    const client = await getUserById(order.clientId);
    if (client instanceof AppError) {
      return client;
    }
    const options = await getOptionsFormRecords();
    if (options instanceof AppError) {
      throw new Error(options.toString());
    }

    // required
    const missing: string[] = [];
    if (!options.logo) missing.push('Company logo (logo)');
    if (!options.companyName) missing.push('Company name (companyName)');
    if (!options.uic) missing.push('Company registration number (uic)');
    if (missing.length) {
      return new AppError(
        `Missing required invoice fields: ${missing.join(', ')}`,
        'MISSING_COMPANY_DATA'
      );
    }

    // Build PDF using streaming approach
    const date = order.createdAt || new Date();
    const dateStr = date.toISOString().replace(/:/g, '-').slice(0, 19);
    const id = generateRandomPassword(8);
    const fileName = `${id}-warranty-${orderId}-order-${dateStr}`;
    const fileInvoice = await buildWarrantyPdfStream(order, options, fileName, 'warranties');

    if (fileInvoice instanceof AppError) {
      return fileInvoice;
    }

    if (!fileInvoice.url) {
      throw new Error(`Invoice #${id} does not have a file URL`);
    }

    const downloadUrl = `${fileInvoice.url}?download=1`;

    return {
      error: false,
      message: 'Successfully generated invoice',
      invoiceNumber: id,
      fileName: fileName,
      fileUrl: fileInvoice.url,
      downloadUrl,
    };
  } catch (error) {
    logger.logError(error, 'GENERATE_INVOICE');
    const message = error instanceof Error ? error.message : 'Failed to generate invoice';
    return new AppError(message, 'GENERATE_FAILED');
  }
}
