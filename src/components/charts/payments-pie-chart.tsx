import { ClientPaymentsPieChart } from './payments-pie-chart-client';

export async function PaymentsPieChart({ time }: { time: number }) {
  await new Promise((resolve) => setTimeout(resolve, time));

  return <ClientPaymentsPieChart />;
}
