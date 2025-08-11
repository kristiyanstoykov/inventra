import { db } from '@/db/drizzle/db';
import { PaymentTypesTable, ProductTable, paymentTypes } from './schema';

async function seedPaymentTypes() {
  console.log('Seeding payment types...');

  // Get all enum values
  // paymentTypes is imported from schema and is an array of payment type strings

  // Fetch existing payment type names from DB
  const existingTypes = await db.select({ name: ProductTable.name }).from(ProductTable);
  const existingNames = new Set(existingTypes.map((row) => row.name));

  // Filter out types that already exist
  const newTypes = paymentTypes.filter((type: string) => !existingNames.has(type));

  // Insert only new types
  if (newTypes.length > 0) {
    await db.insert(PaymentTypesTable).values(
      newTypes.map((type: string) => ({
        name: type as 'cash' | 'card',
      }))
    );
  }

  console.log(`Inserted ${newTypes.length} new payment types.`);
  console.log('✅ Payment types seeded.');
}

seedPaymentTypes()
  .catch((err) => {
    console.error('❌ Payment type seeding failed:', err);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
