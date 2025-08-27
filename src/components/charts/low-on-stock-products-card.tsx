import { getLowOnStockProducts } from '@/db/drizzle/queries/products';
import { LowOnStockProductsCardClient } from './low-on-stock-products-card-client';

export async function LowOnStockProductsCard({ threshold }: { threshold: number }) {
  const result = await getLowOnStockProducts(threshold);

  return <LowOnStockProductsCardClient items={result} />;
}
