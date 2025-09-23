'use server';

import { getTopProductsThisMonthSnapshot } from '@/db/drizzle/queries/orderItems';
import type { Metric } from '@/db/drizzle/queries/orderItems';

export async function getTopProductsThisMonthSnapshotAction(metric: Metric, limit: number = 5) {
  return await getTopProductsThisMonthSnapshot(metric, limit);
}
