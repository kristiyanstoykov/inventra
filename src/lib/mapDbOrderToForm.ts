import { OrderType } from '@/lib/schema/orders';

type DbOrder = {
  id: number | string;
  createdAt?: string | Date;
  date?: string | Date;
  clientId: number | string | null;
  paymentTypeId?: number | string | null;
  paymentType?: string | null;
  items: string | Array<{ id?: number; productId: number | string; quantity: number | string }>;
};

type PaymentType = { id: number; name: string };

export function mapDbOrderToForm(dbOrder: DbOrder, paymentTypesList: PaymentType[]): OrderType {
  const rawItems =
    typeof dbOrder.items === 'string' ? JSON.parse(dbOrder.items) : dbOrder.items || [];
  const items = (rawItems as any[]).map((it) => ({
    productId: Number(it.productId),
    quantity: Number(it.quantity),
  }));

  const dateSrc = dbOrder.date ?? dbOrder.createdAt;
  const date = dateSrc instanceof Date ? dateSrc : new Date(dateSrc as any);

  const ptId = dbOrder.paymentTypeId != null ? Number(dbOrder.paymentTypeId) : undefined;
  const paymentType =
    (ptId && paymentTypesList.find((p) => p.id === ptId)) ||
    (dbOrder.paymentType
      ? paymentTypesList.find((p) => p.name === dbOrder.paymentType)
      : undefined) ||
    paymentTypesList.find((p) => p.name === 'cash') ||
    paymentTypesList[0];

  if (!paymentType) {
    throw new Error('No payment types configured.');
  }

  return {
    id: Number(dbOrder.id),
    date,
    clientId: dbOrder.clientId != null ? Number(dbOrder.clientId) : 0, // ако може да е null -> адаптирай схемата
    items,
    paymentType: { id: paymentType.id, name: paymentType.name as any },
  };
}
