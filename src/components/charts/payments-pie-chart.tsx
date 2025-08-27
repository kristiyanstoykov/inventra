import { getPaymentUsageAllTime } from '@/db/drizzle/queries/orders';
import { ClientPaymentsPieChart } from './payments-pie-chart-client';

export async function PaymentsPieChart() {
  const result = await getPaymentUsageAllTime();

  return <ClientPaymentsPieChart data={result} />;
}
