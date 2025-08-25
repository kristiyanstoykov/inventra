'use server';

import { InvoicesTable, WarrantyTable } from '../schema';
import { InferSelectModel, eq } from 'drizzle-orm';
import { db } from '../db';
import { logger } from '@/lib/logger';
import { AppError } from '@/lib/appError';
import { ResultSetHeader } from 'mysql2';
import { getOrderById } from './orders';
import { getUserById } from './users';
import { getOptionsFormRecords } from './options';
import { empty } from '@/lib/empty';
import { buildWarrantyPdfStream } from '@/lib/pdf/warranty';

export async function createWarranty(
  orderId: number,
  warrantyData: Pick<InferSelectModel<typeof WarrantyTable>, 'createdAt'>
) {
  try {
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

    const warrantyId = await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(WarrantyTable)
        .values({
          orderId,
          createdAt: warrantyData.createdAt ?? new Date(),
        })
        .$returningId();

      if (!inserted?.[0]?.id) {
        throw new AppError('Failed to create warranty', 'CREATE_FAILED');
      }

      const id = inserted[0].id;
      if (!id) throw new AppError('Failed to create warranty', 'CREATE_FAILED');

      const insertedWarranty = await tx
        .select()
        .from(WarrantyTable)
        .where(eq(WarrantyTable.id, id))
        .limit(1);

      const date = insertedWarranty[0].createdAt ?? new Date();
      const dateStr = date.toISOString().replace(/:/g, '-').slice(0, 19);
      const fileName = `${insertedWarranty[0].id}-warranty-${orderId}-order-${dateStr}`;

      const fileInvoice = await buildWarrantyPdfStream(order, options, fileName, 'warranties');

      if (fileInvoice instanceof AppError) {
        throw new Error(fileInvoice.toString());
      }

      if (empty(fileInvoice.url)) {
        throw new Error('Failed to generate invoice PDF');
      }

      const updateResult = await tx
        .update(InvoicesTable)
        .set({ fileName: fileName, fileUrl: fileInvoice.url, updatedAt: new Date() })
        .where(eq(InvoicesTable.id, id))
        .execute();

      // Drizzle (mysql2) returns an OkPacket-like object (MySqlRawQueryResult)
      const raw = Array.isArray(updateResult) ? updateResult[0] : (updateResult as ResultSetHeader);

      const affectedRows = raw && typeof raw.affectedRows === 'number' ? raw.affectedRows : null;
      if (affectedRows === 0) {
        // Try to surface any server message (mysql2 exposes 'info')
        const serverMsg =
          (typeof raw?.info === 'string' && raw.info.length > 0 && raw.info) ||
          `No rows were updated for invoice with id ${id}`;
        throw new AppError(serverMsg, 'UPDATE_FAILED');
      }

      return id;
    });

    if (warrantyId instanceof Error) {
      throw new Error(warrantyId.toString());
    }

    return warrantyId;
  } catch (error) {
    logger.logError(error, 'CREATE_INVOICE');
    const message = error instanceof Error ? error.message : 'Failed to create invoice';
    return new AppError(message, 'CREATE_FAILED');
  }
}

export async function getInvoiceById(invoiceId: number) {
  try {
    const invoice = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.id, invoiceId))
      .limit(1);

    if (!invoice.length) {
      return null;
    }

    return invoice[0];
  } catch (error) {
    logger.logError(error, 'GET_INVOICE_BY_ID');

    if (error instanceof AppError) {
      return error;
    }

    const isMySqlError = (
      e: unknown
    ): e is {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      message?: string;
    } => !!e && typeof e === 'object' && ('sqlMessage' in e || 'code' in e || 'errno' in e);

    if (isMySqlError(error)) {
      const parts: string[] = [];
      if (error.sqlMessage) parts.push(error.sqlMessage);
      else if (error.message) parts.push(error.message);
      if (error.code) parts.push(`code: ${error.code}`);
      if (typeof error.errno === 'number') parts.push(`errno: ${error.errno}`);
      return new AppError(parts.join(' - '), 'GET_FAILED');
    }

    const message = error instanceof Error ? error.message : 'Failed to get invoice';
    return new AppError(message, 'GET_FAILED');
  }
}

export async function getInvoiceByFileName(fileName: string) {
  try {
    const invoice = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.fileName, fileName))
      .limit(1);

    if (!invoice.length) {
      return null;
    }

    return invoice[0];
  } catch (error) {
    logger.logError(error, 'GET_INVOICE_BY_ID');

    if (error instanceof AppError) {
      return error;
    }

    const isMySqlError = (
      e: unknown
    ): e is {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      message?: string;
    } => !!e && typeof e === 'object' && ('sqlMessage' in e || 'code' in e || 'errno' in e);

    if (isMySqlError(error)) {
      const parts: string[] = [];
      if (error.sqlMessage) parts.push(error.sqlMessage);
      else if (error.message) parts.push(error.message);
      if (error.code) parts.push(`code: ${error.code}`);
      if (typeof error.errno === 'number') parts.push(`errno: ${error.errno}`);
      return new AppError(parts.join(' - '), 'GET_FAILED');
    }

    const message = error instanceof Error ? error.message : 'Failed to get invoice';
    return new AppError(message, 'GET_FAILED');
  }
}

export async function getInvoiceByOrderId(orderId: number) {
  try {
    const invoice = await db
      .select()
      .from(InvoicesTable)
      .where(eq(InvoicesTable.orderId, orderId))
      .limit(1);

    if (!invoice) {
      return null;
    }

    return invoice[0];
  } catch (error) {
    logger.logError(error, 'GET_INVOICE_BY_ORDER_ID');
    const message = error instanceof Error ? error.message : 'Failed to get invoice';
    return new AppError(message, 'GET_FAILED');
  }
}

export async function updateInvoiceFile(invoiceId: number, fileUrl: string) {
  try {
    const result = await db
      .update(InvoicesTable)
      .set({ fileUrl, updatedAt: new Date() })
      .where(eq(InvoicesTable.id, invoiceId))
      .execute();

    // Drizzle (mysql2) returns an OkPacket-like object (MySqlRawQueryResult)
    const raw = Array.isArray(result) ? result[0] : (result as ResultSetHeader);

    const affectedRows = raw && typeof raw.affectedRows === 'number' ? raw.affectedRows : null;
    if (affectedRows === 0) {
      // Try to surface any server message (mysql2 exposes 'info')
      const serverMsg =
        (typeof raw?.info === 'string' && raw.info.length > 0 && raw.info) ||
        `No rows were updated for invoice with id ${invoiceId}`;
      throw new AppError(serverMsg, 'UPDATE_FAILED');
    }

    return { error: false, message: `Invoice file updated successfully`, invoiceId, fileUrl };
  } catch (error) {
    logger.logError(error, 'UPDATE_INVOICE_FILE');
    const message = error instanceof Error ? error.message : 'Failed to update invoice file';
    return new AppError(message, 'UPDATE_FAILED');
  }
}

export async function getInvoices() {
  try {
    const invoice = await db.select().from(InvoicesTable);

    if (!invoice.length) {
      return null;
    }

    return invoice;
  } catch (error) {
    logger.logError(error, 'GET_INVOICE_BY_ID');

    if (error instanceof AppError) {
      return error;
    }

    const isMySqlError = (
      e: unknown
    ): e is {
      code?: string;
      errno?: number;
      sqlMessage?: string;
      message?: string;
    } => !!e && typeof e === 'object' && ('sqlMessage' in e || 'code' in e || 'errno' in e);

    if (isMySqlError(error)) {
      const parts: string[] = [];
      if (error.sqlMessage) parts.push(error.sqlMessage);
      else if (error.message) parts.push(error.message);
      if (error.code) parts.push(`code: ${error.code}`);
      if (typeof error.errno === 'number') parts.push(`errno: ${error.errno}`);
      return new AppError(parts.join(' - '), 'GET_FAILED');
    }

    const message = error instanceof Error ? error.message : 'Failed to get invoice';
    return new AppError(message, 'GET_FAILED');
  }
}
