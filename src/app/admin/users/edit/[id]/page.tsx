import { getCategoryById } from '@/drizzle/queries/categories';
import { UpdateCategoryForm } from '@/components/categories/category-edit-form';
import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}

export default async function EditUserPage({ params }: PageProps) {
  // const category = await getCategoryById(Number(params.id));

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/users" className="text-blue-600 hover:underline">
          &larr; Go back
        </Link>
      </div>
      <Card className="max-w-[500px] mt-4">
        <CardHeader>
          <CardTitle>Edit user</CardTitle>
        </CardHeader>
        {/* {category instanceof AppError ? (
          <CardContent>
            <CardDescription>{category.toString()}</CardDescription>
          </CardContent>
        ) : (
          <CardContent className="flex-grow">
            <UpdateCategoryForm category={category} />
          </CardContent>
        )} */}
      </Card>
    </div>
  );
}
