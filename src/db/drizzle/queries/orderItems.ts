import { AppError } from '@/lib/appError';
import { db } from '../db';
import { OrderItemTable } from '../schema';
import { logger } from '@/lib/logger';

export async function insertOrderItem(itemData: {
  orderId: number;
  productId: number;
  quantity: number;
  price: string;
  name: string;
  sku: string | null;
  sn: string | null;
}) {
  try {
    const result = await db.insert(OrderItemTable).values({
      productId: itemData.productId,
      orderId: itemData.orderId,
      quantity: itemData.quantity,
      price: itemData.price,
      name: itemData.name,
      sku: itemData.sku,
      sn: itemData.sn,
    });
    return result;
  } catch (error) {
    logger.logError(error, 'Repository: insertOrderItem');
    return new AppError(error.message || 'Failed to insert order item', 'INSERT_FAILED');
  }
}
