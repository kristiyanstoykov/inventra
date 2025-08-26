import { logger } from '@/lib/logger';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { RoleTable, UserRoleTable } from '../schema';
import { AppError } from '@/lib/appError';
import { getUserById } from './users';
import { ResultSetHeader } from 'mysql2';

export async function getAllRoles() {
  try {
    const roles = await db.select().from(RoleTable);
    return roles;
  } catch (error) {
    logger.logError(error, 'Repository: getAllRoles');
    return new AppError(
      error instanceof Error ? error.message : 'Failed to get all roles',
      'GET_ALL_ROLES_FAILED'
    );
  }
}

export async function getUserRoleIdByUserId(userId: number) {
  try {
    if (!userId || isNaN(userId)) {
      return new AppError('Invalid user ID provided', 'INVALID_USER_ID');
    }

    const [userRole] = await db
      .select()
      .from(UserRoleTable)
      .where(eq(UserRoleTable.userId, userId))
      .limit(1);

    if (!userRole) {
      return new AppError(`User role for user ID ${userId} not found`, 'USER_ROLE_NOT_FOUND');
    }

    return userRole.roleId;
  } catch (error) {
    logger.logError(error, 'Repository: getUserRoleIdByUserId');
    return new AppError(
      error instanceof Error
        ? error.message
        : `Failed to get user role ID for user with ID: ${userId}`,
      'GET_USER_ROLE_ID_FAILED'
    );
  }
}

export async function getRoleById(roleId: number) {
  try {
    if (!roleId || isNaN(roleId)) {
      return new AppError('Invalid role ID provided', 'INVALID_ROLE_ID');
    }

    const [role] = await db.select().from(RoleTable).where(eq(RoleTable.id, roleId)).limit(1);

    if (!role) {
      return new AppError(`Role with ID ${roleId} not found`, 'ROLE_NOT_FOUND');
    }

    return role;
  } catch (error) {
    logger.logError(error, 'Repository: getRoleById');
    return new AppError(
      error instanceof Error ? error.message : `Failed to get role with ID: ${roleId}`,
      'GET_ROLE_FAILED'
    );
  }
}

export async function addRoleToUser(userId: number, roleId: number) {
  try {
    const user = getUserById(userId);
    if (!user) {
      return new AppError(`User with ID ${userId} not found`, 'USER_NOT_FOUND');
    }
    if (!roleId || isNaN(roleId)) {
      return new AppError('Invalid role ID provided', 'INVALID_ROLE_ID');
    }

    const roleExists = await getRoleById(roleId);
    if (roleExists instanceof AppError) {
      return new AppError(roleExists.message, roleExists.code);
    }

    const result = await db
      .insert(UserRoleTable)
      .values({
        userId: userId,
        roleId: roleId,
      })
      .$returningId();

    return result[0]?.id;
  } catch (error) {
    logger.logError(error, 'Repository: addRoleToUser');
    return new AppError(
      error instanceof Error ? error.message : `Failed to add role to user with ID: ${userId}`,
      'ADD_ROLE_FAILED'
    );
  }
}

export async function updateUserRole(userId: number, roleId: number) {
  try {
    const user = await getUserById(userId);
    if (!user) {
      return new AppError(`User with ID ${userId} not found`, 'USER_NOT_FOUND');
    }

    if (!roleId || isNaN(roleId)) {
      return new AppError('Invalid role ID provided', 'INVALID_ROLE_ID');
    }

    const role = await getRoleById(roleId);
    if (role instanceof AppError) {
      return new AppError(role.message, role.code);
    }

    const [userRole] = await db
      .select()
      .from(UserRoleTable)
      .where(eq(UserRoleTable.userId, userId))
      .limit(1);

    if (userRole) {
      // Update existing user-role
      const result = await db
        .update(UserRoleTable)
        .set({ roleId })
        .where(eq(UserRoleTable.userId, userId));
      return result[0];
    } else {
      // Insert new user-role
      const result = await db.insert(UserRoleTable).values({
        userId,
        roleId,
      });
      return result[0];
    }
  } catch (error) {
    logger.logError(error, 'Repository: updateUserRole');
    return new AppError(
      error instanceof Error ? error.message : `Failed to update role for user with ID: ${userId}`,
      'UPDATE_ROLE_FAILED'
    );
  }
}

export async function deleteUserRoleIdByUserId(userId: number) {
  try {
    if (!userId || isNaN(userId)) {
      return new AppError('Invalid user ID provided', 'INVALID_USER_ID');
    }

    const result = await db.delete(UserRoleTable).where(eq(UserRoleTable.userId, userId));

    const raw = Array.isArray(result) ? result[0] : (result as ResultSetHeader);

    // MySqlRawQueryResult has an 'affectedRows' property
    const affectedRows = raw && typeof raw.affectedRows === 'number' ? raw.affectedRows : null;
    if (affectedRows === 0) {
      // Try to surface any server message (mysql2 exposes 'info')
      const serverMsg =
        (typeof raw?.info === 'string' && raw.info.length > 0 && raw.info) ||
        `No user was deleted. User id ${userId}`;
      throw new AppError(serverMsg, 'UPDATE_FAILED');
    }

    return { success: true, message: `Successfully deleted role for user ID ${userId}` };
  } catch (error) {
    logger.logError(error, 'Repository: deleteUserRoleIdByUserId');
    return new AppError(
      error instanceof Error ? error.message : `Failed to delete role for user with ID: ${userId}`,
      'DELETE_ROLE_FAILED'
    );
  }
}
