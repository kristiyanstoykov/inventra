import { db } from '../db'; // adjust the import path as needed
import { PaymentTypesTable } from '../schema'; // adjust the import path as needed

export async function getAllPaymentTypes() {
  return await db.select().from(PaymentTypesTable);
}
