import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/drizzle/db';
import { CapabilityTable, RoleCapabilityTable, UserRoleTable } from '@/drizzle/schema';

/**
 * Check if a user has all the required permissions.
 *
 * @param userId User's numeric ID
 * @param options Permissions options:
 *   - Either pass an array of full permission strings like ['product.create', 'product.read']
 *   - Or pass a resource name like 'product' to check all CRUD permissions
 */
export async function hasPermissions(
  userId: number,
  options: { permissions?: string[]; resource?: string }
): Promise<boolean> {
  const permissions =
    options.permissions ??
    (options.resource
      ? ['create', 'read', 'update', 'delete'].map((action) => `${options.resource}.${action}`)
      : []);

  if (permissions.length === 0) return false;

  const result = await db
    .select({ name: CapabilityTable.name })
    .from(UserRoleTable)
    .innerJoin(RoleCapabilityTable, eq(UserRoleTable.roleId, RoleCapabilityTable.roleId))
    .innerJoin(CapabilityTable, eq(RoleCapabilityTable.capabilityId, CapabilityTable.id))
    .where(and(eq(UserRoleTable.userId, userId), inArray(CapabilityTable.name, permissions)));

  const found = result.map((row) => row.name);
  return permissions.every((p) => found.includes(p));
}
