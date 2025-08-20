import { db } from '@/db/drizzle/db';
import { UserTable, UserRoleTable, RoleTable } from '@/db/drizzle/schema';
import { eq, or, like, sql, desc, asc, inArray } from 'drizzle-orm';
import { AppError } from '@/lib/appError';
import { logger } from '@/lib/logger';
import { empty } from '@/lib/empty';
import { hashPassword, generateSalt } from '@/auth/core/passwordHasher';
import {
  addRoleToUser,
  deleteUserRoleIdByUserId,
  getUserRoleIdByUserId,
  updateUserRole,
} from './roles';
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

type SortableUsersColumn = keyof typeof columnMap;

export const columns = [
  { key: 'id', label: 'ID', sortable: true, searchable: true },
  { key: 'email', label: 'Email', sortable: true, searchable: true },
  { key: 'firstName', label: 'First Name', sortable: true, searchable: true },
  { key: 'lastName', label: 'Last Name', sortable: true, searchable: true },
  { key: 'companyName', label: 'Company', sortable: true, searchable: true },
  { key: 'bulstat', label: 'Bulstat', sortable: true, searchable: true },
  { key: 'vatNumber', label: 'VAT Number', sortable: true, searchable: true },
  { key: 'phone', label: 'Phone', sortable: true, searchable: true },
  { key: 'address', label: 'Address', sortable: true, searchable: true },
  { key: 'roles', label: 'Roles', sortable: false, searchable: false },
  { key: 'createdAt', label: 'Created At', sortable: true, searchable: false },
  { key: 'actions', label: 'Actions', sortable: false, searchable: false },
];

export type userRoleType = {
  id: number;
  name: string;
};

export type paginatedUserType = {
  id: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  companyName: string | null;
  bulstat: string | null;
  vatNumber: string | null;
  phone: string | null;
  address: string | null;
  createdAt: Date;
  roles: userRoleType[];
};

// Get all products with optional sorting and pagination
export async function getAllUsers(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableUsersColumn | null = null,
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

// Create a new user
export async function createUser(userData: {
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  isCompany?: boolean | false;
  companyName?: string | null;
  bulstat?: string | null;
  vatNumber?: string | null;
  phone?: string | null;
  address?: string | null;
  password: string;
  roleId?: number;
}) {
  try {
    if (!userData.roleId || null == userData.roleId || isNaN(userData.roleId)) {
      throw new Error('Invalid role ID provided');
    }

    const salt = generateSalt();
    const passwordHash = await hashPassword(userData.password, salt);

    const [user] = await db
      .insert(UserTable)
      .values({
        email: userData.email,
        firstName: userData.firstName ?? null,
        lastName: userData.lastName ?? null,
        isCompany: userData.isCompany ?? false,
        companyName: userData.companyName ?? null,
        bulstat: userData.bulstat ?? null,
        vatNumber: userData.vatNumber ?? null,
        phone: userData.phone ?? null,
        address: userData.address ?? null,
        password: passwordHash,
        salt: salt,
      })
      .$returningId();

    await addRoleToUser(user.id, userData.roleId);

    return user.id;
  } catch (error) {
    logger.logError(error, 'Repository: createUser');
    return new AppError('Failed to create user', 'CREATE_FAILED');
  }
}

// Update an existing user
export async function updateUser(
  id: number,
  userData: {
    email?: string;
    firstName?: string | null;
    lastName?: string | null;
    companyName?: string | null;
    bulstat?: string | null;
    vatNumber?: string | null;
    phone?: string | null;
    address?: string | null;
    password?: string;
    roleId: number;
  }
) {
  try {
    // Check if the user exists
    const existingUser = await db.select().from(UserTable).where(eq(UserTable.id, id)).limit(1);
    if (existingUser.length === 0) {
      return new AppError(`No user found with ID: ${id}`, 'NOT_FOUND');
    }

    const updateData: Record<string, any> = {};

    if (userData.email !== undefined) updateData.email = userData.email;
    if (userData.firstName !== undefined)
      updateData.firstName = userData.firstName === '' ? null : userData.firstName;
    if (userData.lastName !== undefined)
      updateData.lastName = userData.lastName === '' ? null : userData.lastName;
    if (userData.companyName !== undefined)
      updateData.companyName = userData.companyName === '' ? null : userData.companyName;
    if (userData.bulstat !== undefined)
      updateData.bulstat = userData.bulstat === '' ? null : userData.bulstat;
    if (userData.vatNumber !== undefined)
      updateData.vatNumber = userData.vatNumber === '' ? null : userData.vatNumber;
    if (userData.phone !== undefined)
      updateData.phone = userData.phone === '' ? null : userData.phone;
    if (userData.address !== undefined)
      updateData.address = userData.address === '' ? null : userData.address;

    if (userData.password !== undefined && userData.password !== null && userData.password !== '') {
      const salt = generateSalt();
      const passwordHash = await hashPassword(userData.password, salt);
      updateData.password = passwordHash;
      updateData.salt = salt;
    }

    updateData.updatedAt = sql`CURRENT_TIMESTAMP`;

    if (Object.keys(updateData).length === 0) {
      return new AppError('No fields to update', 'NO_UPDATE_FIELDS');
    }
    await db.update(UserTable).set(updateData).where(eq(UserTable.id, id));
    await updateUserRole(id, userData.roleId);

    return true;
  } catch (error) {
    logger.logError(error, 'Repository: updateUser');
    return new AppError(error.message ?? 'Failed to update user', 'UPDATE_FAILED');
  }
}

// Delete a user
export async function deleteUser(id: number) {
  try {
    // Check if the user exists before attempting to delete
    const existingUser = await db.select().from(UserTable).where(eq(UserTable.id, id)).limit(1);

    if (existingUser.length === 0) {
      throw new Error(`No user found with ID: ${id}`);
    }

    await deleteUserRoleIdByUserId(id);

    // Perform the delete operation
    const result = await db.delete(UserTable).where(eq(UserTable.id, id));

    if (empty(result)) {
      throw new Error(`Failed to delete user with ID: ${id}`);
    }

    return {
      success: true,
      message: `Successfully deleted user #${id} ${existingUser[0].firstName} ${existingUser[0].lastName}`,
    };
  } catch (error: unknown) {
    logger.logError(error, 'Repository: deleteUser');
    return new AppError(
      error instanceof Error ? error.message : `Failed to delete user with ID: ${id}`,
      'DELETE_FAILED'
    );
  }
}

// Get a product by ID
export async function getUserById(id: number) {
  try {
    const result = await db
      .select({
        id: UserTable.id,
        email: UserTable.email,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
        isCompany: UserTable.isCompany,
        companyName: UserTable.companyName,
        bulstat: UserTable.bulstat,
        vatNumber: UserTable.vatNumber,
        phone: UserTable.phone,
        address: UserTable.address,
        createdAt: UserTable.createdAt,
        updatedAt: UserTable.updatedAt,
      })
      .from(UserTable)
      .where(eq(UserTable.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      return new AppError(`No user found with ID: ${id}`);
    }

    const baseUser = result[0];
    const userRoleId = await getUserRoleIdByUserId(result[0].id);

    const user = {
      ...baseUser,
      ...(!(userRoleId instanceof AppError) && { roleId: userRoleId }),
    };

    return user;
  } catch (error) {
    logger.logError(error, 'Repository: getProductById');
    return new AppError(`Failed to fetch product with ID: ${id}`);
  }
}

export async function getPaginatedUsers(
  page: number = 1,
  pageSize: number = 10,
  sortKey?: string,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  const validSortKey = (
    sortKey && sortKey in columnMap ? sortKey : null
  ) as SortableUsersColumn | null;

  const usersOrError = await getAllUsersWithRoles(page, pageSize, validSortKey, sortDir, search);
  if (usersOrError instanceof AppError) {
    return usersOrError;
  }

  try {
    const baseCountQuery = db.select({ count: sql<number>`COUNT(*)` }).from(UserTable);

    if (!empty(search)) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      const searchableKeys = columns
        .filter((col) => col.searchable)
        .map((col) => col.key)
        .filter((key): key is SortableUsersColumn => key in columnMap);

      baseCountQuery.where(
        or(...searchableKeys.map((key) => like(sql`LOWER(${columnMap[key]})`, loweredSearch)))
      );
    }

    const [{ count }] = await baseCountQuery;

    return {
      data: usersOrError,
      total: count,
      page,
      pageSize,
      totalPages: Math.ceil(count / pageSize),
    };
  } catch (error) {
    logger.logError(error, 'Repository: getPaginatedUsers');
    return new AppError('Failed to fetch paginated users', 'FETCH_FAILED');
  }
}

export async function getAllUsersWithRoles(
  page: number = 1,
  pageSize: number = 10,
  sortKey: SortableUsersColumn | null = null,
  sortDir: 'asc' | 'desc' = 'asc',
  search?: string
) {
  try {
    const offset = (page - 1) * pageSize;
    const query = db.select().from(UserTable).limit(pageSize).offset(offset);

    if (search) {
      const loweredSearch = `%${search.toLowerCase()}%`;
      const searchableKeys = columns
        .filter((col) => col.searchable)
        .map((col) => col.key)
        .filter((key): key is SortableUsersColumn => key in columnMap);

      if (searchableKeys.length > 0) {
        query.where(
          or(...searchableKeys.map((key) => like(sql`LOWER(${columnMap[key]})`, loweredSearch)))
        );
      }
    }

    if (sortKey) {
      const column = columnMap[sortKey];
      query.orderBy(sortDir === 'asc' ? asc(column) : desc(column));
    }

    const users = await query;
    const userIds = users.map((u) => u.id);

    let userRoles: {
      userId: number;
      roleId: number;
      roleName: string;
    }[] = [];

    if (userIds.length > 0) {
      userRoles = await db
        .select({
          userId: UserRoleTable.userId,
          roleId: RoleTable.id,
          roleName: RoleTable.name,
        })
        .from(UserRoleTable)
        .innerJoin(RoleTable, eq(UserRoleTable.roleId, RoleTable.id))
        .where(inArray(UserRoleTable.userId, userIds));
    }

    const rolesByUserId = userRoles.reduce((acc, curr) => {
      if (!acc[curr.userId]) acc[curr.userId] = [];
      acc[curr.userId].push({ id: curr.roleId, name: curr.roleName });
      return acc;
    }, {} as Record<number, { id: number; name: string }[]>);

    return users.map((user) => ({
      ...user,
      roles: rolesByUserId[user.id] || [],
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getAllUsersWithRoles');
    return new AppError('Failed to fetch users with roles');
  }
}

export async function getUsersByName(
  name: string
): Promise<{ id: number; name: string }[] | AppError> {
  try {
    const loweredName = `%${name.toLowerCase()}%`;
    const users = await db
      .select({
        id: UserTable.id,
        firstName: UserTable.firstName,
        lastName: UserTable.lastName,
        isCompany: UserTable.isCompany,
        companyName: UserTable.companyName,
      })
      .from(UserTable)
      .where(
        or(
          like(sql`LOWER(${UserTable.firstName})`, loweredName),
          like(sql`LOWER(${UserTable.lastName})`, loweredName),
          like(sql`LOWER(${UserTable.companyName})`, loweredName)
        )
      );

    return users.map((user) => ({
      id: user.id,
      name:
        user.isCompany && user.companyName
          ? user.companyName
          : `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim(),
    }));
  } catch (error) {
    logger.logError(error, 'Repository: getUsersByName');
    return new AppError('Failed to fetch users by name');
  }
}
