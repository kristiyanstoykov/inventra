import { Column, formatFieldValue } from './product-data-table';
import { paginatedProductsType } from '@/drizzle/queries/products';
import { Pencil, Trash2 } from 'lucide-react';
import { deleteProductAction } from '../actions';
import Link from 'next/link';

export function ProductTableBody({
  products,
  stringParams,
  columns,
}: {
  products: paginatedProductsType[];
  stringParams: string;
  columns: Column[];
}) {
  return (
    <tbody>
      {products.length === 0 ? (
        <tr>
          <td colSpan={10} className="px-4 py-4 text-center text-muted-foreground">
            No data available
          </td>
        </tr>
      ) : (
        products.map((product, i) => (
          <tr key={i} className="block md:table-row border border-border rounded-lg mb-4 md:mb-0">
            {columns
              .filter((field) => field.key !== 'actions')
              .map((field) => (
                <td key={field.key} className="block md:border md:table-cell px-4 py-2 text-sm">
                  <div className="flex md:block gap-2">
                    <span className="font-medium text-muted-foreground md:hidden">
                      {field.label}:
                    </span>
                    <span>
                      {field.key === 'price' && product.salePrice ? (
                        <>
                          <span className="line-through text-muted-foreground mr-2">
                            {formatFieldValue(product, 'price')}
                          </span>
                          <span className="text-green-600 font-semibold">
                            {formatFieldValue(product, 'salePrice')}
                          </span>
                        </>
                      ) : (
                        formatFieldValue(product, field.key as keyof paginatedProductsType)
                      )}
                    </span>
                  </div>
                </td>
              ))}
            <td className="block md:border md:table-cell px-4 py-2 text-sm">
              <div className="flex gap-2">
                <Link href={`/admin/products/edit/${product.id}`} title="Edit">
                  <Pencil />
                </Link>
                <form action={deleteProductAction}>
                  <input type="hidden" name="id" value={product.id} />
                  <input type="hidden" name="searchParams" value={stringParams} />
                  <button type="submit" className="text-red-500">
                    <Trash2 />
                  </button>
                </form>
              </div>
            </td>
          </tr>
        ))
      )}
    </tbody>
  );
}
