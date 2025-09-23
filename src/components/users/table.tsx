'use client';

import { DataTable } from '@/components/dataTable/DataTable';
import { DataTableSortableColumnHeader } from '@/components/dataTable/DataTableSortableColumnHeader';
import { ColumnDef } from '@tanstack/react-table';
import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { UserTable } from '@/db/drizzle/schema';
import { InferSelectModel } from 'drizzle-orm';
import { PencilIcon, TrashIcon } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { ActionButton } from '../ActionButton';
import { deleteUserAction } from '@/lib/actions/users';
import { AppError } from '@/lib/appError';
import { toast } from 'sonner';
import { OrderBadge } from '../ui/badge-order-status';
import { Badge } from '../ui/badge';

type Users = InferSelectModel<typeof UserTable> & {
  roles: { id: number; name: string }[];
};

function getColumns(): ColumnDef<Users>[] {
  return [
    {
      accessorKey: 'id',
      accessorFn: (row) => row.id,
      header: ({ column }) => <DataTableSortableColumnHeader title="ID" column={column} />,
      cell: ({ row }) => row.original.id,
    },
    {
      accessorKey: 'firstName',
      accessorFn: (row) => row.firstName,
      header: ({ column }) => <DataTableSortableColumnHeader title="Names" column={column} />,
      cell: ({ row }) => {
        const { isCompany, firstName, lastName, companyName, bulstat, vatNumber, phone, address } =
          row.original;

        if (isCompany) {
          return (
            <div className="flex flex-col gap-1">
              <span className="font-medium">{companyName}</span>
              <ul className="text-xs text-muted-foreground list-disc list-inside">
                {bulstat && <li>Bulstat: {bulstat}</li>}
                {vatNumber && <li>VAT: {vatNumber}</li>}
                {phone && <li>{phone}</li>}
                {address && <li>{address}</li>}
              </ul>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <span>{`${firstName} ${lastName}`}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'email',
      accessorFn: (row) => row.email,
      header: ({ column }) => <DataTableSortableColumnHeader title="Email" column={column} />,
      cell: ({ row }) => {
        const email = row.original.email;
        return (
          <div className="flex items-center gap-2">
            <span>{email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: 'roles',
      accessorFn: (row) => row.roles,
      header: ({ column }) => <DataTableSortableColumnHeader title="Roles" column={column} />,
      cell: ({ row }) => {
        const roles = row.original.roles;
        return (
          <div className="flex items-center gap-2">
            {roles.length > 0 ? (
              roles.map((role) => (
                <OrderBadge
                  key={role.id}
                  variant={role.name.toLowerCase() === 'admin' ? 'cancelled' : 'completed'}
                >
                  {role.name}
                </OrderBadge>
              ))
            ) : (
              <Badge variant={'secondary'} className="border border-muted-foreground">
                No assigned roles
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      id: 'actions',
      header: () => <div>Actions</div>,
      cell: ({ row }) => {
        const id = row.original.id;
        return <ActionCell id={id} />;
      },
    },
  ];
}

export function SkeletonUsersTable() {
  return (
    <UsersTable
      users={[]}
      noResultsMessage={<LoadingSpinner className="size-12" />}
      total={0}
      page={1}
      pageSize={0}
      totalPages={1}
    />
  );
}

export function UsersTable({
  users,
  noResultsMessage = 'No users found',
  total = 0,
  page = 0,
  pageSize = 0,
  totalPages = 1,
}: {
  users: Users[];
  noResultsMessage?: ReactNode;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}) {
  return (
    <DataTable
      data={users}
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
      message: `Successfully deleted user #${id}`,
    };

    const result = await deleteUserAction(id);
    if (result instanceof AppError) {
      data.error = true;
      data.message = result.toString();
      return data;
    }

    if (!result.success) {
      toast.error('Unknown error occurred while deleting user');
      data.error = true;
      data.message = 'Unknown error occurred while deleting user';
      return data;
    }

    return result;
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
        areYouSureDescription={`This action cannot be undone. Are you sure you want to delete user with id ${id}?`}
        router={router}
        routerRefresh={true}
        variant={'destructive'}
      >
        <TrashIcon className="size-4" />
      </ActionButton>
    </div>
  );
}
