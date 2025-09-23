import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { getAllRoles } from '@/db/drizzle/queries/roles';
import { AppError } from '@/lib/appError';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Metadata } from 'next';
import { OrderForm } from '@/components/orders/order-add-form';
import { getAllPaymentTypes } from '@/db/drizzle/queries/paymentTypes';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { getOrderById } from '@/db/drizzle/queries/orders';
import { getUserByIdAction } from '@/lib/actions/users';
import { getProductsByIds } from '@/db/drizzle/queries/products';
import { InitialItem } from '@/components/orders/product-search-field';

export const metadata: Metadata = {
  title: 'Edit Order',
};

type PageProps = {
  params: {
    id: string;
  };
};

export default async function EditOrderPage({ params }: PageProps) {
  return (
    <Suspense fallback={<LoadingSpinner className="size-12" />}>
      <SuspendedPage params={params} />
    </Suspense>
  );
}

async function SuspendedPage({ params }: PageProps) {
  const { id } = await params;
  const idNum = Number(id);
  if (!Number.isFinite(idNum)) throw new AppError('Invalid order id', 'INVALID_ID');

  const orderOrErr = await getOrderById(idNum);
  if (orderOrErr instanceof AppError) throw orderOrErr;

  const paymentTypesList = await getAllPaymentTypes();
  const orderForForm = mapDbOrderToForm(orderOrErr, paymentTypesList);

  const client = await getUserByIdAction(orderForForm.clientId);

  const items = orderForForm.items; // [{ productId, quantity, ... }]
  const productsFromServer = await getProductsByIds(items.map((i) => i.productId));
  if (productsFromServer instanceof AppError) throw productsFromServer;

  // Build a map for O(1) joins
  const productMap = new Map(productsFromServer.map((p) => [p.id, p]));

  // Pair each order item with its product; skip if product missing
  const initialItems: InitialItem[] = items.flatMap((item) => {
    const product = productMap.get(item.productId);
    return product ? [{ orderItem: item, productFromServer: product }] : [];
  });

  let roles = await getAllRoles();

  if (roles instanceof AppError) {
    roles = [];
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="w-[95%] max-w-full text-left">
        <Link href="/admin/orders/" className="text-blue-600 underline hover:text-blue-800">
          <ArrowLeft className="inline h-4" /> Go back
        </Link>
      </div>

      <Card className="w-[95%] m-2">
        <CardHeader>
          <CardTitle>Edit Order {idNum}</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          {/* remove this in prod */}
          {/* <pre>{JSON.stringify(orderForForm, null, 2)}</pre> */}

          <OrderForm
            order={orderForForm}
            paymentTypesList={paymentTypesList}
            initialClient={client}
            initialItems={initialItems.length ? initialItems : null}
            roles={roles}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// --- unchanged except for small ts safety notes ---
function mapDbOrderToForm(
  dbOrder: {
    id: number;
    warehouseId: number;
    clientId: number;
    paymentTypeId: number | null;
    paymentType: 'cash' | 'card' | null;
    status: string;
    createdAt: Date | null;
    clientFirstName: string | null;
    clientLastName: string | null;
    clientNames: string;
    clientCompany: string | null;
    orderTotal: string;
    items: string;
    date?: string | Date | null;
    payment_type_id?: number | null;
  },
  paymentTypesList: { id: number; name: string }[]
) {
  const rawItems =
    typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items || [];
  const items = (rawItems || []).map((it: any) => ({
    id: Number(it.id),
    productId: Number(it.productId),
    quantity: Number(it.quantity),
    name: it.name ?? undefined,
    price: it.price != null ? Number(it.price) : undefined,
  }));

  const dateSrc: any = (dbOrder as any).date ?? dbOrder.createdAt; // make sure your type includes `date` if you rely on it
  const date = dateSrc instanceof Date ? dateSrc : new Date(dateSrc);

  const paymentTypeId = Number(dbOrder.paymentTypeId ?? (dbOrder as any).payment_type_id ?? NaN);
  const fromList = Number.isFinite(paymentTypeId)
    ? paymentTypesList.find((p) => p.id === paymentTypeId)
    : undefined;
  const paymentType =
    fromList ??
    (dbOrder.paymentType ? { id: paymentTypeId, name: String(dbOrder.paymentType) } : undefined);

  return {
    id: Number(dbOrder.id),
    date,
    clientId: Number(dbOrder.clientId),
    items,
    ...(paymentType ? { paymentType } : {}),
  };
}
