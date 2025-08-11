import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserForm } from '@/components/users/user-add-form';
import { getAllRoles } from '@/db/drizzle/queries/roles';
import { AppError } from '@/lib/appError';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { OrderForm } from '@/components/orders/order-add-form';
import { getAllPaymentTypes } from '@/db/drizzle/queries/paymentTypes';

export const metadata: Metadata = {
  title: 'New Order',
};

export default async function NewOrderPage() {
  const paymentTypesList = await getAllPaymentTypes();

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="w-[95%] max-w-full text-left">
        <Link href="/admin/orders/" className="text-blue-600 underline hover:text-blue-800">
          <ArrowLeft className="inline h-4" /> Go back
        </Link>
      </div>
      <Card className="w-[95%] m-2">
        <CardHeader>
          <CardTitle>New Order</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <OrderForm order={null} paymentTypesList={paymentTypesList} />
        </CardContent>
      </Card>
    </div>
  );
}
