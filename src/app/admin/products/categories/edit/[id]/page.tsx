import { AppError } from '@/lib/appError';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { CategoriesForm } from '@/components/categories/categories-add-form';
import { getCategoryById } from '@/db/drizzle/queries/categories';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Category',
};

interface PageProps {
  params: { id: string };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params;
  const category = await getCategoryById(Number(id));

  if (category instanceof AppError) {
    return (
      <div className="flex justify-center mt-10">
        <Card className="max-w-[500px] w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{category.toString()}</CardDescription>
            <div className="mt-4">
              <Link
                href="/admin/products/categories"
                className="text-blue-600 hover:underline"
              >
                &larr; Go back
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <div className="mb-4 w-full max-w-[500px] text-left">
        <Link
          href="/admin/products/categories"
          className="text-blue-600 hover:underline"
        >
          &larr; Go back
        </Link>
      </div>
      <Card className="max-w-[500px] w-full">
        <CardHeader>
          <CardTitle>Edit attribute (ID #{category.id})</CardTitle>
        </CardHeader>
        <CardContent>
          <CategoriesForm attribute={category} />
        </CardContent>
      </Card>
    </div>
  );
}
