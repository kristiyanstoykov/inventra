import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { UserAddForm } from '@/components/users/users-add-form';

export default async function NewUserPage() {
  return (
    <div className="flex flex-col items-center justify-center">
      <div className="mb-4 w-full max-w-[750px]">
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          &larr; Go back
        </Link>
      </div>
      <Card className="w-full max-w-[750px]">
        <CardHeader>
          <CardTitle>New User</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <UserAddForm />
        </CardContent>
      </Card>
    </div>
  );
}
