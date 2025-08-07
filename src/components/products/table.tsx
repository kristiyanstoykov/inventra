'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ProductTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon, X } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { deleteProductAction } from '@/lib/actions/products';
import { toast } from 'sonner';
import { AppError } from '@/lib/appError';
import { ActionButton } from '../ActionButton';
import { Badge } from '../ui/badge';

type Products = InferSelectModel<typeof ProductTable> & {
  categories: { id: number; name: string }[];
  attributes: { id: number; name: string; value: string; unit: string }[];
};

function getColumns(): ColumnDef<Products>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => <DataTableSortableColumnHeader title="ID" column={column} />,
      cell: ({ row }) => row.original.id,
    },
    {
      accessorKey: 'sn',
      accessorFn: (row) => row.sn,
      header: ({ column }) => <DataTableSortableColumnHeader title="SN" column={column} />,
      cell: ({ row }) => {
        const sn = row.original.sn;

        return (
          <div className="flex items-center gap-2">
            <span>{sn}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'name',
      accessorFn: (row) => row.name,
      header: ({ column }) => <DataTableSortableColumnHeader title="Name" column={column} />,
      cell: ({ row }) => {
        const name = row.original.name;

        return (
          <div className="flex items-center gap-2">
            <span>{name}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'price',
      accessorFn: (row) => parseFloat(row.price),
      header: ({ column }) => <DataTableSortableColumnHeader title="Price" column={column} />,
      cell: ({ row }) => {
        const price = parseFloat(row.original.price);
        const salePrice =
          row.original.salePrice != null ? parseFloat(row.original.salePrice) : null;

        return (
          <div className="flex items-center gap-2">
            {salePrice != null ? (
              <>
                <span className="line-through text-muted-foreground">{price.toFixed(2)}</span>
                <span>{salePrice.toFixed(2)}</span>
              </>
            ) : (
              <span>{price.toFixed(2)}</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'Categories',
      accessorFn: (row) => row.categories,
      cell: ({ row }) => {
        let categories = row.original.categories;

        // Normalize to array of objects
        if (!Array.isArray(categories) && categories && typeof categories === 'object') {
          categories = Object.entries(categories).map(([id, name]) => ({
            id: Number(id),
            name: String(name),
          }));
        }

        return (
          <div className="flex items-center gap-2">
            {Array.isArray(categories) && categories.length > 0 ? (
              categories.map((cat) => (
                <Badge key={cat.id} variant="secondary">
                  {cat.name}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">-</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'Attributes',
      accessorFn: (row) => row.attributes,
      cell: ({ row }) => {
        let attributes = row.original.attributes;

        // Normalize to array if the backend returns an object instead of an array
        if (!Array.isArray(attributes) && attributes && typeof attributes === 'object') {
          attributes = Object.values(attributes).map((attr: any) => ({
            id: Number(attr.id),
            name: String(attr.name),
            value: String(attr.value),
            unit: attr.unit ? String(attr.unit) : '',
          }));
        }

        return (
          <div className="flex items-center gap-2">
            {Array.isArray(attributes) && attributes.length > 0 ? (
              attributes.map((attr) => (
                <Badge key={attr.id} variant="secondary">
                  {attr.name}: {attr.value} {attr.unit}
                </Badge>
              ))
            ) : (
              <Badge variant="secondary">-</Badge>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'quantity',
      accessorFn: (row) => row.quantity,
      header: ({ column }) => <DataTableSortableColumnHeader title="Quantity" column={column} />,
      cell: ({ row }) => {
        const quantity = row.original.quantity;

        return (
          <div className="flex items-center gap-2">
            <span>{quantity}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'createdAt',
      accessorFn: (row) => row.createdAt,
      header: ({ column }) => <DataTableSortableColumnHeader title="Created on" column={column} />,
      cell: ({ row }) => {
        const date = row.original.createdAt;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const id = row.original.id;
        return <ActionCell id={id} />;
      },
    },
  ];
}

export function SkeletonProductsTable() {
  return (
    <ProductsTable
      products={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function ProductsTable({
  products,
  noResultsMessage = 'No products found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  products: Products[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={products}
      columns={getColumns()}
      noResultsMessage={noResultsMessage}
      initialFilters={[]}
      total={total}
      page={page}
      pageSize={pageSize}
      totalPages={totalPages}
    />
  );
}

function ActionCell({ id }: { id: number }) {
  const router = useRouter();
  const pathname = usePathname();

  async function handleDelete(id: number) {
    const data = {
      error: false,
      message: `Successfully deleted product #${id}`,
    };

    const result = await deleteProductAction(id);
    if (result instanceof AppError) {
      data.error = true;
      data.message = result.toString();
      toast.error(data.message);
      return data;
    }

    if (!result.success) {
      data.error = true;
      data.message = result.message ?? 'Unknown error occurred while deleting product';
      toast.error(data.message);
      return data;
    }

    return data;
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`${pathname}/edit/${id}`}
        className="inline-flex items-center justify-center rounded-md"
        aria-label="Edit"
      >
        <Button variant={'outline'}>
          <PencilIcon className="size-4" />
          <span className="sr-only">Edit</span>
        </Button>
      </Link>
      <ActionButton
        action={async () => handleDelete(id)}
        requireAreYouSure={true}
        areYouSureDescription="This action cannot be undone. Are you sure you want to delete this product?"
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
