import { db } from '@/drizzle/db';
import {
  UserTable,
  RoleTable,
  CapabilityTable,
  RoleCapabilityTable,
  UserRoleTable,
} from './schema';
import { eq } from 'drizzle-orm';
import { hashPassword, generateSalt } from '@/auth/core/passwordHasher';

async function seed() {
  console.log('Seeding roles...');
  await db.insert(RoleTable).values([{ name: 'admin' }, { name: 'client' }]);

  const [adminRole] = await db.select().from(RoleTable).where(eq(RoleTable.name, 'admin'));
  const [clientRole] = await db.select().from(RoleTable).where(eq(RoleTable.name, 'client'));

  console.log('Seeding capabilities...');
  const capabilities = [
    // Products
    { name: 'product.create', description: 'Create products' },
    { name: 'product.read', description: 'Read products' },
    { name: 'product.update', description: 'Update products' },
    { name: 'product.delete', description: 'Delete products' },
    // Warehouses
    { name: 'warehouse.create', description: 'Create warehouses' },
    { name: 'warehouse.read', description: 'Read warehouses' },
    { name: 'warehouse.update', description: 'Update warehouses' },
    { name: 'warehouse.delete', description: 'Delete warehouses' },
    // Users
    { name: 'user.create', description: 'Create users' },
    { name: 'user.read', description: 'Read users' },
    { name: 'user.update', description: 'Update users' },
    { name: 'user.delete', description: 'Delete users' },
    // Orders
    { name: 'order.create', description: 'Create orders' },
    { name: 'order.read', description: 'Read orders' },
    { name: 'order.update', description: 'Update orders' },
    { name: 'order.delete', description: 'Delete orders' },
    // Categories
    { name: 'category.create', description: 'Create categories' },
    { name: 'category.read', description: 'Read categories' },
    { name: 'category.update', description: 'Update categories' },
    { name: 'category.delete', description: 'Delete categories' },
    // Attributes
    { name: 'attribute.create', description: 'Create attributes' },
    { name: 'attribute.read', description: 'Read attributes' },
    { name: 'attribute.update', description: 'Update attributes' },
    { name: 'attribute.delete', description: 'Delete attributes' },
    // Invitees
    { name: 'invitee.create', description: 'Create invitees' },
    { name: 'invitee.read', description: 'Read invitees' },
    { name: 'invitee.update', description: 'Update invitees' },
    { name: 'invitee.delete', description: 'Delete invitees' },
    // Brands
    { name: 'brand.create', description: 'Create brands' },
    { name: 'brand.read', description: 'Read brands' },
    { name: 'brand.update', description: 'Update brands' },
    { name: 'brand.delete', description: 'Delete brands' },
  ];

  // Insert only capabilities that do not already exist
  const existingCaps = await db.select().from(CapabilityTable);
  const existingNames = new Set(existingCaps.map((cap) => cap.name));
  const newCapabilities = capabilities.filter((cap) => !existingNames.has(cap.name));
  if (newCapabilities.length > 0) {
    await db.insert(CapabilityTable).values(newCapabilities);
  }

  // Filter only the capabilities we seeded
  const relevantCaps = (await db.select().from(CapabilityTable)).filter((cap) =>
    capabilities.some((c) => c.name === cap.name)
  );

  console.log('Clearing role_capabilities table...');
  await db.delete(RoleCapabilityTable);

  console.log('Assigning capabilities to admin role...');
  await db.insert(RoleCapabilityTable).values(
    relevantCaps.map((cap) => ({
      roleId: adminRole.id,
      capabilityId: cap.id,
    }))
  );

  console.log('Creating users...');
  const adminSalt = generateSalt();
  const adminPassword = await hashPassword('admin', adminSalt);

  await db.insert(UserTable).values({
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    salt: adminSalt,
    password: adminPassword,
    role: 'admin',
  });

  const [adminUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, 'admin@example.com'));

  const clientSalt = generateSalt();
  const clientPassword = await hashPassword('client', clientSalt);

  await db.insert(UserTable).values({
    email: 'client@example.com',
    firstName: 'Client',
    lastName: 'User',
    salt: clientSalt,
    password: clientPassword,
    role: 'customer',
  });

  const [clientUser] = await db
    .select()
    .from(UserTable)
    .where(eq(UserTable.email, 'client@example.com'));

  console.log('Mapping users to roles...');
  await db.insert(UserRoleTable).values([
    {
      userId: adminUser.id,
      roleId: adminRole.id,
      warehouseId: null,
    },
    {
      userId: clientUser.id,
      roleId: clientRole.id,
      warehouseId: null,
    },
  ]);

  console.log('✅ Seed complete.');
}

seed()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
