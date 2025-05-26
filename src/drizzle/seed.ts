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
    { name: 'product.create', description: 'Create products' },
    { name: 'product.read', description: 'Read products' },
    { name: 'product.update', description: 'Update products' },
    { name: 'product.delete', description: 'Delete products' },
  ];

  await db.insert(CapabilityTable).values(capabilities);

  const insertedCapabilities = await db.select().from(CapabilityTable).where(
    // MySQL doesn't support `IN` shorthand in Drizzle, so use basic OR logic or filter afterward
    eq(CapabilityTable.name, 'product.create') // dummy to prevent errors, filter below
  );

  // Filter only the capabilities we seeded
  const relevantCaps = (await db.select().from(CapabilityTable)).filter((cap) =>
    capabilities.some((c) => c.name === cap.name)
  );

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
