import { getMonthlyRevenueProfitLast6 } from '@/db/drizzle/queries/orders';
import { ClientProfitsChart6Months } from './profits-chart-6-months-client';

export async function ProfitsChart6Months() {
  const result = await getMonthlyRevenueProfitLast6();

  return <ClientProfitsChart6Months {...result} />;
}
