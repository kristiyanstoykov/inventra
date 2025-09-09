import { db } from '@/db/drizzle/db';
import {
  OrderTable,
  OrderItemTable,
  ProductTable,
  UserTable,
  PaymentTypesTable,
  UserRoleTable,
  InvoicesTable,
} from '@/db/drizzle/schema';
import { and, gte, eq, sql, or, like, desc, asc, inArray, lt } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { OrderSchema } from '@/lib/schema/orders';
import z from 'zod';
import { empty } from '@/lib/empty';
import { generateRandomPassword, generateSalt, hashPassword } from '@/auth/core/passwordHasher';
import { getRoleById } from './roles';
import { startOfMonth, subMonths, addMonths, format } from 'date-fns';
import { OrderPaymentType } from '@/lib/schema/order-payment-type';

// Map for sortable columns in orders
const orderColumnMap = {
  id: OrderTable.id,
  clientId: OrderTable.clientId,
  status: OrderTable.status,
  createdAt: OrderTable.createdAt,
} as const;

type SortableOrderColumn = keyof typeof orderColumnMap;

export type OrderItemAgg = {
  id: number;
  productId: number;
  name: string | null;
  quantity: number;
  sn: string;
  price: number | string;
  warranty: number | null;
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
) {
  try {
    const offset = (page - 1) * pageSize;
    await db.execute(sql`SET SESSION group_concat_max_len = 1000000`);
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
                'sn', ${OrderItemTable.sn},
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
        invoiceId: InvoicesTable.id,
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
      .leftJoin(InvoicesTable, eq(OrderTable.id, InvoicesTable.orderId))
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
export async function getOrderById(id: number | string | Promise<number | string>) {
  try {
    const resolved = await Promise.resolve(id);
    const orderId = Number(resolved);
    if (!Number.isFinite(orderId)) {
      return new AppError(`Invalid order ID: ${resolved}`, 'VALIDATION_ERROR');
    }

    const [order] = await db
      .select({
        id: OrderTable.id,
        warehouseId: OrderTable.warehouseId,
        clientId: OrderTable.clientId,
        paymentTypeId: OrderTable.paymentType, // <- matches your column
        paymentType: PaymentTypesTable.name,
        status: OrderTable.status,
        invoiceId: InvoicesTable.id,
        createdAt: OrderTable.createdAt,
        clientFirstName: UserTable.firstName,
        clientLastName: UserTable.lastName,
        clientNames: sql<string>`CONCAT(${UserTable.firstName}, ' ', ${UserTable.lastName})`,
        clientCompany: UserTable.companyName,
        orderTotal: sql<string>`COALESCE(SUM(${OrderItemTable.price} * ${OrderItemTable.quantity}), 0)`,
      })
      .from(OrderTable)
      .leftJoin(UserTable, eq(OrderTable.clientId, UserTable.id))
      .leftJoin(OrderItemTable, eq(OrderItemTable.orderId, OrderTable.id))
      .leftJoin(PaymentTypesTable, eq(OrderTable.paymentType, PaymentTypesTable.id))
      .leftJoin(InvoicesTable, eq(OrderTable.id, InvoicesTable.orderId))
      .where(eq(OrderTable.id, orderId))
      .groupBy(OrderTable.id)
      .limit(1);

    if (!order) {
      return new AppError(`No order found with ID: ${orderId}`, 'NOT_FOUND');
    }

    // Second query: fetch all items for the order and return them as an array
    const items = await db
      .select({
        id: OrderItemTable.id,
        productId: OrderItemTable.productId,
        name: OrderItemTable.name,
        sn: OrderItemTable.sn,
        quantity: OrderItemTable.quantity,
        price: OrderItemTable.price,
        warranty: OrderItemTable.warranty,
      })
      .from(OrderItemTable)
      .where(eq(OrderItemTable.orderId, orderId))
      .orderBy(OrderItemTable.id);

    // joining order items to return object
    return { ...order, items };
  } catch (error: any) {
    logger.logError(error, 'Repository: getOrderById'); // fixed label
    return new AppError(error?.message || 'Failed to fetch order', 'FETCH_FAILED');
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
    const { items, clientId, paymentType, date, status } = data;
    const dt = date ? new Date(date) : new Date();

    if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) {
      throw new AppError('Invalid date', 'INVALID_DATE');
    }

    const formatted = dt.toISOString().slice(0, 19).replace('T', ' ');

    const res = await db.transaction(async (tx) => {
      // Resolve client: can be a numeric id or an object describing the client to (re)use / create
      let resolvedClientId: number | null = null;

      if (typeof clientId === 'number') {
        resolvedClientId = clientId;
      } else if (clientId && typeof clientId === 'object') {
        const {
          id: existingId,
          email,
          isCompany,
          firstName,
          lastName,
          phone,
          roleId,
          companyName,
          bulstat,
          vatNumber,
          address,
        } = clientId;

        if (existingId && Number.isFinite(existingId)) {
          resolvedClientId = Number(existingId);
        } else {
          // Basic validation of required props
          if (!email || !firstName || !lastName || !phone || typeof roleId !== 'number') {
            throw new AppError('Invalid client object payload', 'VALIDATION_ERROR');
          }

          // Try to find existing client by unique email
          const [existing] = await tx
            .select({ id: UserTable.id })
            .from(UserTable)
            .where(eq(UserTable.email, email))
            .limit(1);

          if (existing) {
            resolvedClientId = existing.id;
          } else {
            const salt = generateSalt();
            const passwordHash = await hashPassword(generateRandomPassword(), salt);

            const insertedClient = await tx
              .insert(UserTable)
              .values({
                email,
                isCompany,
                firstName,
                lastName,
                salt,
                password: passwordHash,
                phone,
                companyName: companyName ?? null,
                bulstat: bulstat ?? null,
                vatNumber: vatNumber ?? null,
                address: address ?? null,
                createdAt: sql`NOW()`,
                updatedAt: sql`NOW()`,
              })
              .$returningId();

            if (!insertedClient?.[0]?.id) {
              throw new AppError('Failed to create client', 'CREATE_CLIENT_FAILED');
            }
            resolvedClientId = insertedClient[0].id as number;

            const roleExists = await getRoleById(roleId);
            if (roleExists instanceof AppError) {
              return new AppError(roleExists.message, roleExists.code);
            }
            const result = await tx
              .insert(UserRoleTable)
              .values({
                userId: resolvedClientId,
                roleId: roleId,
              })
              .$returningId();

            if (!result[0]?.id) {
              throw new AppError('Failed to assign role to user', 'ASSIGN_ROLE_FAILED');
            }
          }
        }
      } else {
        throw new AppError('clientId is required', 'VALIDATION_ERROR');
      }

      if (!resolvedClientId) {
        throw new AppError('Could not resolve client id', 'VALIDATION_ERROR');
      }

      // 1) create order
      const inserted = await tx
        .insert(OrderTable)
        .values({
          clientId: resolvedClientId,
          warehouseId: 1, // TODO: make dynamic when warehouse logic is implemented
          paymentType: paymentType.id,
          createdAt: sql`STR_TO_DATE(${formatted}, '%Y-%m-%d %H:%i:%s')`,
          status: status ?? 'pending',
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
          warranty: ProductTable.warranty,
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
            warranty: p.warranty ?? 0,
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

export async function updateOrder(orderId: number, data: OrderData) {
  // Note: OrderSchema allows a union for clientId; here we accept only a number
  const { items: newItemsInput, clientId, paymentType, date, status } = data;

  // Normalize the date (we use NOW() for created/updatedAt, but if you want to store the date field—ensure it is valid)
  const dt = date ? new Date(date) : new Date();
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) {
    throw new AppError('Invalid date', 'INVALID_DATE');
  }

  // Prepare the new items as a map keyed by productId
  const newItems = new Map<number, { productId: number; quantity: number }>();
  for (const it of newItemsInput) {
    // Aggregate quantities for duplicate productIds coming from the UI, if any
    const prev = newItems.get(it.productId)?.quantity ?? 0;
    newItems.set(it.productId, { productId: it.productId, quantity: prev + it.quantity });
  }

  return await db.transaction(async (tx) => {
    // 0) Fetch current state of the order + its items
    const currentItems = await tx
      .select({
        id: OrderItemTable.id,
        productId: OrderItemTable.productId,
        quantity: OrderItemTable.quantity,
      })
      .from(OrderItemTable)
      .where(eq(OrderItemTable.orderId, orderId));

    if (!currentItems?.length && empty(newItemsInput)) {
      throw new AppError('Nothing to update', 'NO_CHANGES');
    }

    const oldMap = new Map<number, { id: number; productId: number; quantity: number }>();
    for (const it of currentItems) oldMap.set(it.productId, it);

    // 1) Lock the products in a deterministic order (union of old and new productIds)
    const productIdsToLock = Array.from(
      new Set<number>([...currentItems.map((x) => x.productId), ...Array.from(newItems.keys())])
    ).sort((a, b) => a - b);

    if (productIdsToLock.length) {
      // SELECT ... FOR UPDATE to avoid lock waits during concurrent updates
      await tx.execute(sql`
        SELECT ${ProductTable.id}
        FROM ${ProductTable}
        WHERE ${inArray(ProductTable.id, productIdsToLock)}
        ORDER BY ${ProductTable.id}
        FOR UPDATE
      `);
    }
    // 2) Return quantities for items that were decreased or removed
    // deltaReturn = oldQty - newQty (if > 0 => add back to inventory)
    for (const { productId, quantity: oldQty } of currentItems) {
      const newQty = newItems.get(productId)?.quantity ?? 0;
      const deltaReturn = oldQty - newQty;
      if (deltaReturn > 0) {
        const res = await tx
          .update(ProductTable)
          .set({
            quantity: sql`${ProductTable.quantity} + ${deltaReturn}`,
            updatedAt: sql`NOW()`,
          })
          .where(eq(ProductTable.id, productId));
        // (optional) check affectedRows; no guard needed here
      }
    }

    // 3) Subtract quantities for items that were increased or are new
    // deltaTake = newQty - oldQty (if > 0 => subtract from inventory)
    for (const [productId, { quantity: newQty }] of newItems) {
      const oldQty = oldMap.get(productId)?.quantity ?? 0;
      const deltaTake = newQty - oldQty;
      if (deltaTake > 0) {
        const updateRes = await tx
          .update(ProductTable)
          .set({
            quantity: sql`${ProductTable.quantity} - ${deltaTake}`,
            updatedAt: sql`NOW()`,
          })
          .where(
            and(eq(ProductTable.id, productId), gte(ProductTable.quantity, String(deltaTake)))
          );

        const affectedRows =
          Array.isArray(updateRes) && updateRes[0]?.affectedRows !== undefined
            ? updateRes[0].affectedRows
            : (updateRes as any)?.affectedRows;

        if (!affectedRows) {
          throw new AppError(
            `Insufficient stock for product ${productId} (need +${deltaTake})`,
            'INSUFFICIENT_STOCK'
          );
        }
      }
    }

    // 4) Synchronize order_items
    // 4.1) Delete removed ones
    const toDelete = currentItems.filter((x) => !newItems.has(x.productId)).map((x) => x.productId);

    if (toDelete.length) {
      await tx
        .delete(OrderItemTable)
        .where(
          and(eq(OrderItemTable.orderId, orderId), inArray(OrderItemTable.productId, toDelete))
        );
    }

    // 4.2) Update changed quantities (where items exist and quantities differ)
    const toUpdate = currentItems.filter((x) => {
      const n = newItems.get(x.productId)?.quantity;
      return typeof n === 'number' && n !== x.quantity;
    });

    for (const it of toUpdate) {
      const newQty = newItems.get(it.productId)!.quantity;
      await tx
        .update(OrderItemTable)
        .set({
          quantity: newQty,
        })
        .where(
          and(eq(OrderItemTable.orderId, orderId), eq(OrderItemTable.productId, it.productId))
        );
    }

    // 4.3) Add the new items (those not present yet)
    const toInsert = Array.from(newItems.values()).filter((x) => !oldMap.has(x.productId));
    if (toInsert.length) {
      // Fetch data for denormalization (name, sku, price...)
      const ids = toInsert.map((x) => x.productId);
      const products = await tx
        .select({
          id: ProductTable.id,
          name: ProductTable.name,
          sku: ProductTable.sku,
          sn: ProductTable.sn,
          price: ProductTable.price,
        })
        .from(ProductTable)
        .where(inArray(ProductTable.id, ids));

      if (products.length !== ids.length) {
        throw new AppError('Some products not found for insertion', 'NO_PRODUCTS_FOUND');
      }

      await tx.insert(OrderItemTable).values(
        products.map((p) => {
          const match = toInsert.find((i) => i.productId === p.id)!;
          return {
            orderId,
            productId: p.id,
            quantity: match.quantity,
            name: p.name,
            sku: p.sku ?? null,
            sn: p.sn ?? null,
            price:
              typeof p.price === 'string'
                ? p.price
                : p.price !== undefined
                ? String(p.price)
                : '0.00',
            createdAt: sql`NOW()`,
          };
        })
      );
    }

    // 5) Update the order header
    const headerUpdate: Partial<typeof OrderTable.$inferInsert> = {
      paymentType: paymentType.id,
      updatedAt: new Date(),
      status: status ?? 'pending',
    };

    if (typeof clientId === 'number' && Number.isFinite(clientId)) {
      headerUpdate.clientId = clientId;
    }

    await tx.update(OrderTable).set(headerUpdate).where(eq(OrderTable.id, orderId));

    return {
      success: true,
      message: `Order #${orderId} updated successfully.`,
      orderId,
    };
  });
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

export type MonthlyPoint = { monthKey: string; month: string; revenue: number; profit: number };

export async function getMonthlyRevenueProfitLast6(): Promise<{
  data: MonthlyPoint[];
  thisMonth: number; // profit this month
  trendPct: number; // vs previous month
}> {
  const start = subMonths(startOfMonth(new Date()), 5);
  const end = startOfMonth(addMonths(new Date(), 1));

  const rows = await db
    .select({
      createdAt: OrderTable.createdAt,
      price: OrderItemTable.price,
      qty: OrderItemTable.quantity,
      cost: OrderItemTable.deliveryPrice,
    })
    .from(OrderItemTable)
    .innerJoin(OrderTable, eq(OrderItemTable.orderId, OrderTable.id))
    .where(
      or(
        eq(OrderTable.status, 'completed'),
        gte(OrderTable.createdAt, start),
        lt(OrderTable.createdAt, end)
      )
    );

  // Pre-fill 6 months + current
  const buckets = new Map<string, MonthlyPoint>();
  for (let d = new Date(start); d < end; d = addMonths(d, 1)) {
    const key = format(d, 'yyyy-MM');
    buckets.set(key, { monthKey: key, month: format(d, 'LLL'), revenue: 0, profit: 0 });
  }

  // Aggregate in JS
  for (const r of rows) {
    const key = format(r.createdAt!, 'yyyy-MM');
    const b = buckets.get(key);
    if (!b) continue;

    const price = Number(r.price ?? 0);
    const qty = Number(r.qty ?? 0);
    const cost = Number(r.cost ?? 0); // per-line cost from order_items

    b.revenue += price * qty;
    b.profit += (price - cost) * qty;
  }

  const data = Array.from(buckets.values());
  const thisMonth = data[data.length - 1]?.profit ?? 0;
  const prevMonth = data[data.length - 2]?.profit ?? 0;
  const trendPct = prevMonth ? ((thisMonth - prevMonth) / prevMonth) * 100 : 0;

  return {
    data: data.map((d) => ({
      ...d,
      revenue: Number(d.revenue.toFixed(2)),
      profit: Number(d.profit.toFixed(2)),
    })),
    thisMonth: Number(thisMonth.toFixed(2)),
    trendPct: Number(trendPct.toFixed(2)),
  };
}

export type PaymentUsagePoint = {
  paymentType: OrderPaymentType; // 'cash' | 'card'
  usage: number;
  fill: string; // Pie chart sector
};

export async function getPaymentUsageAllTime(): Promise<PaymentUsagePoint[]> {
  const rows = await db
    .select({
      paymentType: PaymentTypesTable.name,
      usage: sql<number>`COUNT(*)`,
    })
    .from(OrderTable)
    .innerJoin(PaymentTypesTable, eq(OrderTable.paymentType, PaymentTypesTable.id))
    .where(eq(OrderTable.status, 'completed'))
    .groupBy(PaymentTypesTable.name);

  const map = new Map<OrderPaymentType, number>([
    ['cash', 0],
    ['card', 0],
  ]);

  for (const r of rows) {
    const key = r.paymentType as OrderPaymentType;
    map.set(key, (map.get(key) ?? 0) + Number(r.usage ?? 0));
  }

  return [
    { paymentType: 'cash', usage: map.get('cash')!, fill: 'var(--primary)' },
    { paymentType: 'card', usage: map.get('card')!, fill: 'var(--chart-3)' },
  ];
}
