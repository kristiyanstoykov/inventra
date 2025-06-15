'use client';

import { paginatedUserType } from '@/drizzle/queries/users';
import { empty } from '@/lib/empty';
import { formatDateTime } from '@/lib/utils';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { toast } from 'sonner';

export type Column = {
  key: string;
  label: string;
  sortable?: boolean;
};

export function formatFieldValue(
  user: paginatedUserType,
  field: keyof paginatedUserType
): React.ReactNode {
  const value = user[field];

  if (field === 'createdAt') {
    return user.createdAt ? formatDateTime(user.createdAt) : '-';
  }

  if (field === 'roles' && value && typeof value === 'object') {
    const roleNames = (value as Array<{ id: number; name: string }>).map((role) => role.name);
    return roleNames.length ? roleNames.join(', ') : '-';
  }

  if (empty(value) || value === null || value === undefined) {
    return '-';
  }

  if (value instanceof Date) {
    return formatDateTime(value);
  }

  return value.toString();
}

export function UsersTableBody({
  users: users,
  columns,
}: {
  users: paginatedUserType[];
  columns: Column[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleDelete(id: number) {
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('id', id.toString());

        const res = await fetch('/api/admin/user/', {
          method: 'DELETE',
          body: formData,
        });

        const result = await res.json();

        if (result.success) {
          toast.success(`User #${id} deleted successfully`);
          router.refresh();
        } else {
          toast.error(result.message ?? 'Failed to delete user');
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (err) {
        toast.error('Unexpected error occurred.');
      }
    });
  }

  if (!users.length) {
    return (
      <tbody>
        <tr>
          <td colSpan={columns.length} className="px-4 py-4 text-center text-muted-foreground">
            No categories found.
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className="relative">
      {isPending && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-muted/80 md:absolute md:inset-0 md:z-10 md:bg-muted/60">
          <Loader2 className="h-24 w-24 animate-spin text-muted-foreground" />
        </div>
      )}
      {users.map((user, i) => (
        <tr
          key={i}
          className="block md:table-row border border-border rounded-lg md:hover:bg-muted/80 mb-4 md:mb-0"
        >
          {columns
            .filter((col) => col.key !== 'actions')
            .map((col) => (
              <td key={col.key} className="block md:table-cell md:border px-4 py-2 text-sm">
                <div className="flex md:block gap-2">
                  <span className="font-medium text-muted-foreground md:hidden">{col.label}:</span>
                  <span>{formatFieldValue(user, col.key as keyof paginatedUserType)}</span>
                </div>
              </td>
            ))}
          <td className="block md:table-cell md:border px-4 py-2 text-sm">
            <div className="flex gap-2">
              <Link href={`/admin/users/edit/${user.id}`} title="Edit">
                <Pencil />
              </Link>
              <button onClick={() => handleDelete(user.id)} className="text-red-500" title="Delete">
                <Trash2 />
              </button>
            </div>
          </td>
        </tr>
      ))}
    </tbody>
  );
}
