import { db } from '@/db/drizzle/db';
import {
  OrderTable,
  OrderItemTable,
  ProductTable,
  UserTable,
  PaymentTypesTable,
} from '@/db/drizzle/schema';
import { and, gte, eq, sql, or, like, desc, asc, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { OrderSchema } from '@/lib/schema/orders';
import z from 'zod';
import { empty } from '@/lib/empty';

// Map for sortable columns in orders
const orderColumnMap = {
  id: OrderTable.id,
  clientId: OrderTable.clientId,
  status: OrderTable.status,
  createdAt: OrderTable.createdAt,
} as const;

type SortableOrderColumn = keyof typeof orderColumnMap;

type OrderItemAgg = {
  id: number;
  productId: number;
  name: string | null; // ако колоната е nullable
  quantity: number;
  price: number | string; // внимавай: SUM/price може да идва като string от MySQL
};
type OrderRow = {
  id: number;
  warehouseId: number | null;
  clientId: number;
  paymentTypeId: number | null;
  paymentType: string | null;
  status: number;
  createdAt: Date | string; // зависи как идва от драйвера
  clientFirstName: string | null;
  clientLastName: string | null;
  clientNames: string | null;
  clientCompany: string | null;
  orderTotal: string; // SUM в MySQL често идва като string
  items: OrderItemAgg[]; // ← ето това ни трябва
};

export async function getAllOrders(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableOrderColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
): Promise<OrderRow[] | AppError> {
  try {
    const offset = (page - 1) * pageSize;

    const itemsJson = sql<OrderItemAgg[]>`
      COALESCE(
        CAST(
          CONCAT(
            '[',
            GROUP_CONCAT(
              JSON_OBJECT(
                'id', ${OrderItemTable.id},
                'productId', ${OrderItemTable.productId},
                'name', ${OrderItemTable.name},
                'quantity', ${OrderItemTable.quantity},
                'price', ${OrderItemTable.price}
              )
              ORDER BY ${OrderItemTable.id} ASC
              SEPARATOR ','
            ),
            ']'
          ) AS JSON
        ),
        JSON_ARRAY()
      )
    `;

    const query = db
      .select({
        id: OrderTable.id,
        warehouseId: OrderTable.warehouseId,
        clientId: OrderTable.clientId,
        paymentTypeId: OrderTable.paymentType,
        paymentType: PaymentTypesTable.name,
        status: OrderTable.status,
        createdAt: OrderTable.createdAt,
        clientFirstName: UserTable.firstName,
        clientLastName: UserTable.lastName,
        clientNames: sql<string>`CONCAT(${UserTable.firstName}, ' ', ${UserTable.lastName})`,
        clientCompany: UserTable.companyName,
        orderTotal: sql<string>`COALESCE(SUM(${OrderItemTable.price} * ${OrderItemTable.quantity}), 0)`,
        items: itemsJson, // aggregated items as a JSON array
      })
      .from(OrderTable)
      .leftJoin(UserTable, eq(OrderTable.clientId, UserTable.id))
      .leftJoin(OrderItemTable, eq(OrderItemTable.orderId, OrderTable.id))
      .leftJoin(PaymentTypesTable, eq(OrderTable.paymentType, PaymentTypesTable.id))
      .limit(pageSize)
      .offset(offset)
      .groupBy(OrderTable.id);

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      query.where(
        or(
          like(sql`LOWER(${UserTable.firstName})`, loweredSearch),
          like(sql`LOWER(${UserTable.lastName})`, loweredSearch),
          like(sql`LOWER(${UserTable.companyName})`, loweredSearch),
          like(sql`CAST(${OrderTable.id} AS CHAR)`, loweredSearch)
        )
      );
    }

    if (sortKey) {
      const column = orderColumnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    return await query;
  } catch (error: any) {
    logger.logError(error, 'Repository: getAllOrders');
    return new AppError(error.message || 'Failed to fetch orders');
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

export async function getPaginatedOrders(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'desc' | 'asc' = 'desc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in orderColumnMap ? sortKey : 'id'
  ) as SortableOrderColumn | null;

  if (empty(sortDir)) {
    sortDir = 'desc';
  }

  const orders = await getAllOrders(page, pageSize, validSortKey, sortDir, search);
  if (orders instanceof AppError) {
    return orders;
  }

  try {
    // Count query with search
    const baseCountQuery = db
      .select({ count: sql<number>`COUNT(*)` })
      .from(OrderTable)
      .leftJoin(UserTable, eq(OrderTable.clientId, UserTable.id));

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      baseCountQuery.where(
        or(
          like(sql`LOWER(${UserTable.firstName})`, loweredSearch),
          like(sql`LOWER(${UserTable.lastName})`, loweredSearch),
          like(sql`LOWER(${UserTable.companyName})`, loweredSearch),
          like(sql`CAST(${OrderTable.id} AS CHAR)`, loweredSearch)
        )
      );
    }

    const [{ count }] = await baseCountQuery;

    return {
      data: orders,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error: unknown) {
    logger.logError(error, 'Repository: getPaginatedOrders');
    return new AppError(error.message || 'Failed to fetch paginated orders', 'FETCH_FAILED');
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

export async function createOrder(data: z.infer<typeof OrderSchema>) {
  try {
    const { items, clientId, paymentType, date } = data;
    const dt = date ? new Date(date) : new Date();

    if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) {
      throw new AppError('Invalid date', 'INVALID_DATE');
    }

    const formatted = dt.toISOString().slice(0, 19).replace('T', ' ');

    const res = await db.transaction(async (tx) => {
      // 1) create order (omit createdAt and use DB default, or pass dt directly)
      const inserted = await db
        .insert(OrderTable)
        .values({
          clientId,
          warehouseId: 1, // TODO Change to dynamic warehouse ID, when warehouse logic is implemented
          paymentType: paymentType.id,
          createdAt: sql`STR_TO_DATE(${formatted}, '%Y-%m-%d %H:%i:%s')`,
        })
        .$returningId();

      if (!inserted?.[0]?.id) {
        throw new AppError('Failed to create order', 'CREATE_FAILED');
      }
      const orderId = inserted[0].id as number;

      // 2) Reduce quantity automatically
      for (const it of items) {
        const updateRes = await tx
          .update(ProductTable)
          .set({
            quantity: sql`${ProductTable.quantity} - ${it.quantity}`,
            updatedAt: sql`NOW()`,
          })
          .where(
            and(eq(ProductTable.id, it.productId), gte(ProductTable.quantity, String(it.quantity)))
          );

        const affectedRows =
          Array.isArray(updateRes) && updateRes[0]?.affectedRows !== undefined
            ? updateRes[0].affectedRows
            : updateRes?.affectedRows;

        if (!affectedRows) {
          throw new AppError(
            `Insufficient stock for product ${it.productId}`,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // 3) Fetch the products (to denormalize name/sku/price into order_items)
      const productIds = items.map((i) => i.productId);
      const products = await tx
        .select({
          id: ProductTable.id,
          name: ProductTable.name,
          sku: ProductTable.sku,
          sn: ProductTable.sn,
          price: ProductTable.price,
        })
        .from(ProductTable)
        .where(inArray(ProductTable.id, productIds));

      if (!products?.length) {
        throw new AppError('No products found for the provided IDs', 'NO_PRODUCTS_FOUND');
      }

      // 4) Add order items
      await tx.insert(OrderItemTable).values(
        products.map((p) => {
          const match = items.find((i) => i.productId === p.id)!;
          return {
            orderId,
            productId: p.id,
            quantity: match.quantity ?? 1,
            name: p.name,
            sku: p.sku ?? null,
            sn: p.sn ?? null,
            price:
              typeof p.price === 'string'
                ? p.price
                : p.price !== undefined
                ? String(p.price)
                : '0.00',
            createdAt: sql`STR_TO_DATE(${formatted}, '%Y-%m-%d %H:%i:%s')`,
          };
        })
      );

      // if we get to here everything is ok
      return { orderId };
    });

    return {
      success: true,
      message: `Order #${res.orderId} created successfully.`,
    };
  } catch (error: any) {
    logger.logError(error, 'Repository: createOrder');

    let message = 'Failed to create order';

    // MySQL / Drizzle errors often have a `cause` with details
    if (error?.cause?.sqlMessage) {
      message = error.cause.sqlMessage; // MySQL's own message
    } else if (error?.sqlMessage) {
      message = error.sqlMessage;
    } else if (error?.message) {
      message = error.message;
    }

    // Log full error object for debugging
    console.error('Error creating order:', {
      message,
      code: error?.code,
      errno: error?.errno,
      sql: error?.sql,
      params: error?.parameters ?? error?.params,
      stack: error?.stack,
    });

    return new AppError(message, 'CREATE_FAILED');
  }
}

export async function deleteOrder(id: number) {
  try {
    const result = await db.delete(OrderTable).where(eq(OrderTable.id, id));
    // Drizzle returns an array with ResultSetHeader as first element
    const affectedRows =
      Array.isArray(result) && result[0]?.affectedRows !== undefined
        ? result[0].affectedRows
        : result?.affectedRows;

    if (!affectedRows) {
      throw new AppError('Order not found or already deleted', 'NOT_FOUND');
    }

    return {
      success: true,
      error: false,
      message: `Successfully deleted order #${id}`,
      deleted: affectedRows,
    };
  } catch (error) {
    logger.logError(error, 'Repository: deleteOrder');
    return new AppError(error.message || 'Failed to delete order', 'DELETE_FAILED');
  }
}
