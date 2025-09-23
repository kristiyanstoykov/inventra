import { AppError } from '@/lib/appError';
import { db } from '../db';
import { OrderItemTable, OrderTable } from '../schema';
import { logger } from '@/lib/logger';
import { getProductsByIds } from './products';
import { empty } from '@/lib/empty';
import { startOfMonth, addMonths } from 'date-fns';
import { and, eq, gte, lt, desc, sql } from 'drizzle-orm';

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
            warranty: itemData.warranty ?? null,
          };
        })
    );

    return result;
  } catch (error) {
    logger.logError(error, 'Repository: insertOrderItem');
    return new AppError(error.message || 'Failed to insert order item', 'INSERT_FAILED');
  }
}

export type Metric = 'quantity' | 'revenue';
export type TopItemSnapshot = {
  productId: number;
  name: string | null;
  sku: string | null;
  qty: number;
  revenue: number;
};

export async function getTopProductsThisMonthSnapshot(
  metric: Metric = 'quantity',
  limit = 3
): Promise<TopItemSnapshot[]> {
  const start = startOfMonth(new Date());
  const end = startOfMonth(addMonths(new Date(), 1));

  const qtySum = sql<number>`SUM(${OrderItemTable.quantity})`;
  const revenueSum = sql<number>`SUM(${OrderItemTable.quantity} * ${OrderItemTable.price})`;

  const rows = await db
    .select({
      productId: OrderItemTable.productId,
      name: sql<string>`MAX(${OrderItemTable.name})`,
      sku: sql<string>`MAX(${OrderItemTable.sku})`,
      qty: qtySum,
      revenue: revenueSum,
    })
    .from(OrderItemTable)
    .innerJoin(OrderTable, eq(OrderItemTable.orderId, OrderTable.id))
    .where(
      and(
        eq(OrderTable.status, 'completed'),
        gte(OrderTable.createdAt, start),
        lt(OrderTable.createdAt, end)
      )
    )
    .groupBy(OrderItemTable.productId)
    .orderBy(metric === 'quantity' ? desc(qtySum) : desc(revenueSum))
    .limit(limit);

  return rows.map((r) => ({
    productId: r.productId,
    name: r.name,
    sku: r.sku,
    qty: Number(r.qty ?? 0),
    revenue: Number(r.revenue ?? 0),
  }));
}
