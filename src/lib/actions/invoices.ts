'use server';

import { getOrderById } from '@/db/drizzle/queries/orders';
import { logger } from '../logger';
import { getOptionsFormRecords } from '@/db/drizzle/queries/options';
import { AppError } from '../appError';
import { buildInvoicePdf } from '../pdf/invoice';
import { saveBufferAsLocalFile } from '../storage/local';

function nextInvoiceNumber(orderId: number) {
  // Temp: INV-YYYYMMDD-<orderId>
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `INV-${y}${m}${day}-${orderId}`;
}

export async function generateInvoiceAction(orderId: number) {
  try {
    if (!orderId || isNaN(orderId)) {
      return new AppError('Invalid order ID', 'INVALID_ID');
    }

    const order = await getOrderById(orderId);
    if (!order) return new Error(`Order #${orderId} not found`);

    if (order instanceof AppError) {
      throw new Error(order.toString());
    }

    const options = await getOptionsFormRecords();
    if (options instanceof AppError) return options;

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

    // Build PDF
    const invoiceNo = nextInvoiceNumber(orderId);
    const pdf = await buildInvoicePdf(
      order,
      {
        companyName: options.companyName,
        uic: options.uic,
        vatNumber: options.vatNumber || '',
        email: options.email || '',
        phone: options.phone || '',
        address: options.address || '',
        city: options.city || '',
        postalCode: options.postalCode || '',
        country: options.country || '',
        representative: options.representative || '',
        notes: options.notes || '',
        logo: options.logo, // URL to /media/...
      },
      invoiceNo
    );

    // Save locally
    const { url } = await saveBufferAsLocalFile(pdf, 'invoices', `${invoiceNo}.pdf`);
    const downloadUrl = `${url}?download=1`;

    // TODO: later create a record in DB: invoices(id, orderId, number, fileUrl, issuedAt, total, ...)
    return {
      error: false,
      message: 'Successfully generated invoice',
      invoiceNumber: invoiceNo,
      fileUrl: url, // e.g. /media/invoices/INV-20250814-39.pdf
      downloadUrl,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to generate invoice';
    return new AppError(message, 'GENERATE_FAILED');
  }
}
