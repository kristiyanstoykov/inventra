import { getAttributeById } from '@/drizzle/queries/attributes';
import { UpdateAttributeForm } from '@/components/attributes/attribute-update-form';
import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

interface PageProps {
  params: { id: string };
}
export default async function EditAttributePage({ params }: PageProps) {
  const attribute = await getAttributeById(Number(params.id));

  return (
    <div>
      <div className="mb-4">
        <Link href="/admin/products/attributes" className="text-blue-600 hover:underline">
          &larr; Go back
        </Link>
      </div>
      <Card className="max-w-[500px] mt-4">
        <CardHeader>
          <CardTitle>Edit attribute</CardTitle>
        </CardHeader>
        {attribute instanceof AppError ? (
          <CardContent>
            <CardDescription>{attribute.toString()}</CardDescription>
          </CardContent>
        ) : (
          <CardContent className="flex-grow">
            <UpdateAttributeForm attribute={attribute} />
          </CardContent>
        )}
      </Card>
    </div>
  );
}
