import { db } from '@/drizzle/db';
import {
  OrderTable,
  OrderItemTable,
  ProductTable,
  UserTable,
  WarehouseTable,
} from '@/drizzle/schema';
import { eq, sql, desc, asc, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';

// Map for sortable columns in orders
const orderColumnMap = {
  id: OrderTable.id,
  clientId: OrderTable.clientId,
  status: OrderTable.status,
  createdAt: OrderTable.createdAt,
} as const;

type SortableOrderColumn = keyof typeof orderColumnMap;

// Get all orders with optional sorting and pagination
export async function getAllOrders(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableOrderColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;

    const query = db
      .select({
        id: OrderTable.id,
        warehouseId: OrderTable.warehouseId,
        clientId: OrderTable.clientId,
        status: OrderTable.status,
        createdAt: OrderTable.createdAt,
        clientFirstName: UserTable.firstName,
        clientLastName: UserTable.lastName,
        clientNames: sql<string>`CONCAT(${UserTable.firstName}, ' ', ${UserTable.lastName})`,
        clientCompany: UserTable.companyName,
      })
      .from(OrderTable)
      .leftJoin(UserTable, eq(OrderTable.clientId, UserTable.id))
      .limit(pageSize)
      .offset(offset);

    if (sortKey) {
      const column = orderColumnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    const results = await query;
    return results;
  } catch (error) {
    logger.logError(error, 'Repository: getAllOrders');
    return new AppError('Failed to fetch orders');
  }
}

// Get an order by ID
export async function getOrderById(id: number) {
  try {
    return await db.select().from(OrderTable).where(eq(OrderTable.id, id)).limit(1);
  } catch (error) {
    logger.logError(error, 'Repository: getOrderById');
    return new AppError(`Failed to fetch order with ID: ${id}`);
  }
}

// Get paginated orders with total count
export async function getPaginatedOrders(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  // Validate sortKey
  const validSortKey = (
    sortKey && sortKey in orderColumnMap ? sortKey : null
  ) as SortableOrderColumn | null;

  // 1) Fetch page of orders with pagination + sorting
  const orders = await getAllOrders(page, pageSize, validSortKey, sortDir);
  if (orders instanceof AppError) {
    return orders;
  }

  // 2) Fetch total count
  try {
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(OrderTable);

    return {
      data: orders,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error: unknown) {
    logger.logError(error, 'Repository: getPaginatedOrders');
    return new AppError('Failed to fetch paginated orders', 'FETCH_FAILED');
  }
}

// Get all orders with their items and product info
export async function getAllOrdersWithItems(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableOrderColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;

    // Step 1: Build the base query to fetch orders with optional pagination and sorting
    const query = db.select().from(OrderTable).limit(pageSize).offset(offset);

    // Step 2: Apply sorting if sortKey is provided
    if (sortKey) {
      const column = orderColumnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    // Step 3: Fetch orders
    const orders = await query;
    const orderIds = orders.map((o) => o.id);

    // Step 4: Fetch order items and product info for the orders
    let orderItems: {
      orderId: number;
      productId: number;
      quantity: number;
      price: string;
      productName: string;
      productSku: string | null;
    }[] = [];

    if (orderIds.length > 0) {
      orderItems = await db
        .select({
          orderId: OrderItemTable.orderId,
          productId: OrderItemTable.productId,
          quantity: OrderItemTable.quantity,
          price: OrderItemTable.price,
          productName: ProductTable.name,
          productSku: ProductTable.sku,
        })
        .from(OrderItemTable)
        .innerJoin(ProductTable, eq(OrderItemTable.productId, ProductTable.id))
        .where(inArray(OrderItemTable.orderId, orderIds));
    }

    // Step 5: Group items by orderId
    const itemsByOrderId = orderItems.reduce(
      (acc, curr) => {
        if (!acc[curr.orderId]) {
          acc[curr.orderId] = [];
        }
        acc[curr.orderId].push({
          productId: curr.productId,
          name: curr.productName,
          sku: curr.productSku,
          quantity: curr.quantity,
          price: curr.price,
        });
        return acc;
      },
      {} as Record<
        number,
        Array<{
          productId: number;
          name: string;
          sku: string | null;
          quantity: number;
          price: string;
        }>
      >
    );

    // Step 6: Combine orders with items and return the results
    return orders.map((order) => ({
      ...order,
      items: itemsByOrderId[order.id] || [], // Add items array for each order
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getAllOrdersWithItems');
    return new AppError('Failed to fetch orders with items');
  }
}
