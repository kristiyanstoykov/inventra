import { AppError } from '@/lib/appError';
import { db } from '../db';
import { OrderItemTable } from '../schema';
import { logger } from '@/lib/logger';
import { getProductsByIds } from './products';
import { empty } from '@/lib/empty';

export async function insertOrderItem(
  orderId: number,
  items: {
    productId: number;
    quantity: number;
  }[]
) {
  try {
    const productIds = items.map((item) => item.productId);
    const products = await getProductsByIds(productIds);

    if (products instanceof AppError) {
      throw new AppError('Failed to fetch products for order items', 'FETCH_PRODUCTS_FAILED');
    }

    if (empty(products)) {
      throw new AppError('No products found for the provided IDs', 'NO_PRODUCTS_FOUND');
    }

    const result = await db.insert(OrderItemTable).values(
      products
        .filter(
          (itemData): itemData is NonNullable<typeof itemData> =>
            itemData !== null && itemData !== undefined
        )
        .map((itemData) => {
          const matchingItem = items.find((i) => i.productId === itemData.id);
          return {
            productId: itemData.id,
            orderId: orderId,
            quantity: matchingItem?.quantity ?? 1, // take from parameter
            price:
              typeof itemData.price === 'string'
                ? itemData.price
                : itemData.price !== undefined
                ? String(itemData.price)
                : undefined,
            name: itemData.name,
            sku: itemData.sku ?? '',
            sn: itemData.sn ?? '',
          };
        })
    );

    return result;
  } catch (error) {
    logger.logError(error, 'Repository: insertOrderItem');
    return new AppError(error.message || 'Failed to insert order item', 'INSERT_FAILED');
  }
}
