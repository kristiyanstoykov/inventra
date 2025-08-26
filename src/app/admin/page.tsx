import { getCurrentUser } from '@/auth/nextjs/currentUser';
import { PaymentsPieChart } from '@/components/charts/payments-pie-chart';
import { ProfitsChart6Months } from '@/components/charts/profits-chart-6-months';
import { SkeletonProfitsChart6Months } from '@/components/charts/profits-chart-6-months-skeleton';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Heading } from '@/components/ui/heading';
import { AppError } from '@/lib/appError';
import { Separator } from '@radix-ui/react-separator';
import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Dashboard',
};

/* TODO charts
  Row 1:
   - Total Sales this month - Card with number similar to the bar chart and var chart at the bottom with previous months
   - New clients this month - same as above

  Row 2:
   - Top 3 Selling Products ever
   - Low Stock products (orange) - list format product name and sku or sn
   - Out of Stock products (red) - list format product name and sku or sn
   - Payment Methods usage (cash/card) - Pie chart
*/
export default async function AdminPage() {
  const user = await getCurrentUser({ withFullUser: true, redirectIfNotFound: true });
  if (user instanceof AppError) {
    throw user;
  }

  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Heading size={'h2'} as={'h1'} className="text-4xl mb-8">
        Welcome to <span className="text-primary font-semibold">Inventra</span>, {user.firstName}.
      </Heading>
      <div className="flex flex-row gap-4">
        <Button asChild variant="secondary" size="lg">
          <Link href="/admin/products">Manage Products</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/admin/categories">Manage Categories</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/admin/orders">Manage Orders</Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="/admin/users">Manage Users</Link>
        </Button>
      </div>
      <Separator className="border border-t-1 my-4" />
      <div className="flex flex-row gap-4">
        <Suspense fallback={<SkeletonProfitsChart6Months />}>
          <ProfitsChart6Months time={2000} />
        </Suspense>
        <Suspense fallback={<SkeletonProfitsChart6Months />}>
          <ProfitsChart6Months time={2000} />
        </Suspense>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-row gap-4">
        <Suspense
          fallback={
            <div>
              <LoadingSpinner />
            </div>
          }
        >
          <PaymentsPieChart time={2000} />
        </Suspense>
      </div>
    </div>
  );
}
