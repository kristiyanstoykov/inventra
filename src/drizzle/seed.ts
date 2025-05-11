import { db } from './db'; // Adjust as needed
import { RoleTable, CapabilityTable, RoleCapabilityTable } from './schema'; // Adjust import paths

// Seed data
const roles = [{ name: 'admin' }, { name: 'user' }, { name: 'customer' }];

const capabilities = [
  { name: 'manage_users', description: 'Ability to manage users' },
  { name: 'view_orders', description: 'Can view customer orders' },
  { name: 'edit_products', description: 'Can edit product listings' },
];

const roleCapabilityMap: Record<string, string[]> = {
  admin: ['manage_users', 'view_orders', 'edit_products'],
  user: ['view_orders'],
  customer: [],
};

async function seed() {
  // Insert roles
  await db.insert(RoleTable).values(roles);
  const roleRows = await db.select().from(RoleTable);
  const roleMap = Object.fromEntries(roleRows.map((role) => [role.name, role.id]));
  console.log('Roles inserted:', roleMap);

  // Insert capabilities
  await db.insert(CapabilityTable).values(capabilities);
  const capabilityRows = await db.select().from(CapabilityTable);
  const capabilityMap = Object.fromEntries(capabilityRows.map((cap) => [cap.name, cap.id]));
  console.log('Capabilities inserted:', capabilityMap);

  // Insert role_capabilities
  const roleCapabilityEntries = [];
  for (const [roleName, capList] of Object.entries(roleCapabilityMap)) {
    for (const capName of capList) {
      roleCapabilityEntries.push({
        roleId: roleMap[roleName],
        capabilityId: capabilityMap[capName],
      });
    }
  }

  if (roleCapabilityEntries.length > 0) {
    await db.insert(RoleCapabilityTable).values(roleCapabilityEntries);
    console.log('Role-capabilities inserted.');
  }

  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
});
