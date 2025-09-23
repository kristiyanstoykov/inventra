import { getOutOfStockProducts } from '@/db/drizzle/queries/products';
import { OutOfStockProductsCardClient } from './out-of-stock-products-card-client';

export async function OutOfStockProductsCard() {
  const result = await getOutOfStockProducts();

  return <OutOfStockProductsCardClient items={result} />;
}
