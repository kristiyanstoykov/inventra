import { getCategoryById } from '@/drizzle/queries/categories';
import { UpdateCategoryForm } from '@/components/categories/category-edit-form';
import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface PageProps {
  params: { id: string };
}

export default async function EditCategoryPage({ params }: PageProps) {
  const category = await getCategoryById(Number(params.id));

  if (category instanceof AppError) {
    return (
      <div>
        <h1>Edit category</h1>
        <p>Category not found.</p>
      </div>
    );
  }

  return (
    <div>
      <Card className="max-w-[500px] mt-4">
        <CardHeader>
          <CardTitle>Edit category</CardTitle>
        </CardHeader>
        <CardContent className="flex-grow">
          <UpdateCategoryForm category={category} />
        </CardContent>
      </Card>
    </div>
  );
}
