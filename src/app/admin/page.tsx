import { getCurrentUser } from '@/auth/nextjs/currentUser';
import { SkeletonChart6Months } from '@/components/charts/chart-6-months-skeleton';
import { LowOnStockProductsCard } from '@/components/charts/low-on-stock-products-card';
import { NewUsersChart6Months } from '@/components/charts/new-users-chart-6-months';
import { OutOfStockProductsCard } from '@/components/charts/out-of-stock-products-card';
import { PaymentsPieChart } from '@/components/charts/payments-pie-chart';
import { ProfitsChart6Months } from '@/components/charts/profits-chart-6-months';
import { ClientTopSellingProductsDualChart } from '@/components/charts/top-selling-products-dual-chart-client';
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
   - [x] Total Sales this month - Card with number similar to the bar chart and var chart at the bottom with previous months
   - [x] New clients this month - same as above

  Row 2:
   - [ ] Top 3 Selling Products ever
   - [ ] Low Stock products (orange) - list format product name and sku or sn
   - [ ] Out of Stock products (red) - list format product name and sku or sn
   - [ ] Payment Methods usage (cash/card) - Pie chart
*/
export default async function AdminPage() {
  const mockItems = [
    { productId: 101, name: 'Wireless Mouse', sku: 'WM-101', qty: 0 },
    { productId: 102, name: 'Mechanical Keyboard RGB Cherry MX Brown', sku: 'KB-102', qty: 0 },
    { productId: 103, name: '27" 4K Monitor UltraSharp', sku: 'MON-103', qty: 0 },
    { productId: 103, name: '27" 4K Monitor UltraSharp', sku: 'MON-103', qty: 0 },
    { productId: 103, name: '27" 4K Monitor UltraSharp', sku: 'MON-103', qty: 0 },
    { productId: 103, name: '27" 4K Monitor UltraSharp', sku: 'MON-103', qty: 0 },
  ];
  const user = await getCurrentUser({ withFullUser: true, redirectIfNotFound: true });
  if (user instanceof AppError) {
    throw user;
  }

  return (
    <div className="container p-4 w-[var(--content-max-width-xl)]">
      <Heading size={'h2'} as={'h1'} className="text-4xl mb-8">
        Welcome to <span className="text-primary font-semibold">Inventra</span>, {user.firstName}.
      </Heading>
      <div className="flex flex-row flex-wrap gap-4">
        <Button asChild variant="default" size="lg">
          <Link href="/admin/products">Manage Products</Link>
        </Button>
        <Button asChild variant="default" size="lg">
          <Link href="/admin/orders">Manage Orders</Link>
        </Button>
        <Button asChild variant="default" size="lg">
          <Link href="/admin/categories">Manage Categories</Link>
        </Button>
        <Button asChild variant="default" size="lg">
          <Link href="/admin/users">Manage Users</Link>
        </Button>
      </div>
      <Separator className="border border-t-1 my-4" />
      <div className="flex flex-row flex-wrap gap-4">
        <Suspense fallback={<SkeletonChart6Months />}>
          <ProfitsChart6Months />
        </Suspense>
        <Suspense fallback={<SkeletonChart6Months />}>
          <NewUsersChart6Months />
        </Suspense>
        <Suspense fallback={<SkeletonChart6Months />}>
          <PaymentsPieChart />
        </Suspense>
      </div>
      <Separator className="my-4" />
      <div className="flex flex-row flex-wrap gap-4">
        <ClientTopSellingProductsDualChart />
        <LowOnStockProductsCard threshold={5} />
        <OutOfStockProductsCard />
      </div>
    </div>
  );
}
