import { AppError } from '@/lib/appError';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { getUserById } from '@/db/drizzle/queries/users';
import { UserForm } from '@/components/users/user-add-form';
import { ArrowLeft } from 'lucide-react';
import { getAllRoles } from '@/db/drizzle/queries/roles';

interface PageProps {
  params: { id: string };
}

export default async function EditUserPage({ params }: PageProps) {
  const { id } = await params;

  const user = await getUserById(Number(id));
  let roles = await getAllRoles();

  if (roles instanceof AppError) {
    roles = [];
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="w-full max-w-[750px] text-left mt-2 mb-4">
        <Link
          href="/admin/users/"
          className="text-blue-600 underline hover:text-blue-800"
        >
          <ArrowLeft className="inline h-4" /> Go back
        </Link>
      </div>
      <Card className="w-full max-w-[750px]">
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
        </CardHeader>
        {user instanceof AppError ? (
          <CardContent>
            <CardDescription>{user.toString()}</CardDescription>
          </CardContent>
        ) : (
          <CardContent className="flex-grow">
            <UserForm user={user} roles={roles} />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
