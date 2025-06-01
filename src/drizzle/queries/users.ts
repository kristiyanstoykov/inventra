import { db } from '@/drizzle/db';
import { UserTable, UserRoleTable, RoleTable } from '@/drizzle/schema';
import { eq, sql, desc, asc, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
// import { empty } from '@/lib/empty';

const columnMap = {
  id: UserTable.id,
  email: UserTable.email,
  firstName: UserTable.firstName,
  lastName: UserTable.lastName,
  createdAt: UserTable.createdAt,
  companyName: UserTable.companyName,
  bulstat: UserTable.bulstat,
  vatNumber: UserTable.vatNumber,
} as const;

type SortableProductColumn = keyof typeof columnMap;

// Get all products with optional sorting and pagination
export async function getAllUsers(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableProductColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;

    const query = db.select().from(UserTable).limit(pageSize).offset(offset);

    if (sortKey) {
      const column = columnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    const results = await query;
    return results;
  } catch (error) {
    logger.logError(error, 'Repository: getAllProducts');
    return new AppError('Failed to fetch products');
  }
}

// Get a product by ID
export async function getUserById(id: number) {
  try {
    return await db.select().from(UserTable).where(eq(UserTable.id, id)).limit(1);
  } catch (error) {
    logger.logError(error, 'Repository: getProductById');
    return new AppError(`Failed to fetch product with ID: ${id}`);
  }
}

export async function getPaginatedUsers(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  // Validate sortKey
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : null
  ) as SortableProductColumn | null;

  // 1) Fetch page of products with pagination + sorting
  const users = await getAllUsers(page, pageSize, validSortKey, sortDir);
  if (users instanceof AppError) {
    return users;
  }

  // 2) Fetch total count
  try {
    const [{ count }] = await db.select({ count: sql<number>`COUNT(*)` }).from(UserTable);

    return {
      data: users,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error: unknown) {
    logger.logError(error, 'Repository: getPaginatedProducts');
    return new AppError('Failed to fetch paginated products', 'FETCH_FAILED');
  }
}

export async function getAllUsersWithRoles(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableProductColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc'
) {
  try {
    const offset = (page - 1) * pageSize;

    // Step 1: Build the base query to fetch users with optional pagination and sorting
    const query = db.select().from(UserTable).limit(pageSize).offset(offset);

    // Step 2: Apply sorting if sortKey is provided
    if (sortKey) {
      const column = columnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    // Step 3: Fetch users
    const users = await query;
    const userIds = users.map((u) => u.id);

    // Step 4: Fetch roles for the users
    let userRoles: {
      userId: number;
      roleId: number;
      roleName: string;
    }[] = [];

    if (userIds.length > 0) {
      userRoles = await db
        .select({
          userId: UserRoleTable.userId,
          roleId: UserRoleTable.roleId,
          roleName: RoleTable.name,
        })
        .from(UserRoleTable)
        .innerJoin(RoleTable, eq(UserRoleTable.roleId, RoleTable.id))
        .where(inArray(UserRoleTable.userId, userIds));
    }

    // Step 5: Group roles by userId
    const rolesByUserId = userRoles.reduce(
      (acc, curr) => {
        if (!acc[curr.userId]) {
          acc[curr.userId] = [];
        }
        acc[curr.userId].push({
          id: curr.roleId,
          name: curr.roleName,
        });
        return acc;
      },
      {} as Record<number, Array<{ id: number; name: string }>>
    );

    // Step 6: Combine users with roles and return the results
    return users.map((user) => ({
      ...user,
      roles: rolesByUserId[user.id] || [], // Add roles array for each user
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getAllUsersWithRoles');
    return new AppError('Failed to fetch users with roles');
  }
}
