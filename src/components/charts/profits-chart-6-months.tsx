import { ClientProfitsChart6Months } from './profits-chart-6-months-client';

export async function ProfitsChart6Months({ time }: { time: number }) {
  await new Promise((resolve) => setTimeout(resolve, time));

  return <ClientProfitsChart6Months />;
}
