import { AppError } from '@/lib/appError';
import { db } from '../db';
import { OrderItemTable } from '../schema';
import { logger } from '@/lib/logger';

export async function insertOrderItem(
  orderId: number,
  productId: number,
  quantity: number,
  price: string
) {
  try {
    const result = await db.insert(OrderItemTable).values({
      orderId,
      productId,
      quantity,
      price,
    });
    return result;
  } catch (error) {
    logger.logError(error, 'Repository: insertOrderItem');
    return new AppError('Failed to insert order item', 'INSERT_FAILED');
  }
}
