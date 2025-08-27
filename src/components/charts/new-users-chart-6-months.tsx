import { ClientNewUsersChart6Months } from './new-users-chart-6-months-client';
import { getMonthlyNewClientsLast6 } from '@/db/drizzle/queries/users';

export async function NewUsersChart6Months() {
  const result = await getMonthlyNewClientsLast6();

  return <ClientNewUsersChart6Months {...result} />;
}
