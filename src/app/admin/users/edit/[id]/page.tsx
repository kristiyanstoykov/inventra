import { UpdateCategoryForm } from '@/components/categories/category-edit-form';
import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { getUserById } from '@/drizzle/queries/users';
import { UserEditForm } from '@/components/users/users-edit-form';

interface PageProps {
  params: { id: string };
}

export default async function EditUserPage({ params }: PageProps) {
  const user = await getUserById(Number(params.id));

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 w-full max-w-[750px]">
        <Link href="/admin/users" className="text-link hover:link-hover">
          &larr; Go back
        </Link>
      </div>
      <Card className="w-full max-w-[750px] mt-4">
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
        </CardHeader>
        {user instanceof AppError ? (
          <CardContent>
            <CardDescription>{user.toString()}</CardDescription>
          </CardContent>
        ) : (
          <CardContent className="flex-grow">
            <UserEditForm user={user} />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
