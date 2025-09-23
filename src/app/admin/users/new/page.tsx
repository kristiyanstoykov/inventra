import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { UserForm } from '@/components/users/user-add-form';
import { getAllRoles } from '@/db/drizzle/queries/roles';
import { AppError } from '@/lib/appError';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default async function NewUserPage() {
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
          <CardTitle>New User</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <UserForm user={null} roles={roles} />
        </CardContent>
      </Card>
    </div>
  );
}
