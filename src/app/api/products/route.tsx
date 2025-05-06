import { sql } from 'drizzle-orm';
import { db } from '@/drizzle/db';
import { ProductTable } from '@/drizzle/schema';
import { asc, desc } from 'drizzle-orm';
import { NextResponse } from 'next/server';

const SORTABLE_COLUMNS = {
  id: ProductTable.id,
  name: ProductTable.name,
  sku: ProductTable.sku,
  sn: ProductTable.sn,
  price: ProductTable.price,
  salePrice: ProductTable.salePrice,
  deliveryPrice: ProductTable.deliveryPrice,
  quantity: ProductTable.quantity,
  createdAt: ProductTable.createdAt,
  updatedAt: ProductTable.updatedAt,
} as const;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');
  const sortKey = (searchParams.get('sort') as keyof typeof SORTABLE_COLUMNS) || 'id';
  const sortDir = searchParams.get('dir') === 'asc' ? 'asc' : 'desc';

  const offset = (page - 1) * pageSize;
  const orderByClause =
    sortDir === 'asc' ? asc(SORTABLE_COLUMNS[sortKey]) : desc(SORTABLE_COLUMNS[sortKey]);

  const [data, totalResult] = await Promise.all([
    db.select().from(ProductTable).orderBy(orderByClause).limit(pageSize).offset(offset),
    db.select({ count: sql<number>`COUNT(*)` }).from(ProductTable),
  ]);

  return NextResponse.json({
    data,
    total: totalResult[0].count,
    page,
    pageSize,
  });
}
