import { getAttributeById } from '@/db/drizzle/queries/attributes';
import { AttributeForm } from '@/components/attributes/attribute-add-form';
import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Attribute',
};

interface PageProps {
  params: { id: string };
}

export default async function EditAttributePage({ params }: PageProps) {
  const { id } = await params;
  const attribute = await getAttributeById(Number(id));

  if (attribute instanceof AppError) {
    return (
      <div className="flex justify-center mt-10">
        <Card className="max-w-[500px] w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{attribute.toString()}</CardDescription>
            <div className="mt-4">
              <Link href="/admin/products/attributes" className="text-blue-600 hover:underline">
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
        <Link href="/admin/products/attributes" className="text-blue-600 hover:underline">
          &larr; Go back
        </Link>
      </div>
      <Card className="max-w-[500px] w-full">
        <CardHeader>
          <CardTitle>Edit attribute (ID #{attribute.id})</CardTitle>
        </CardHeader>
        <CardContent>
          <AttributeForm attribute={attribute} />
        </CardContent>
      </Card>
    </div>
  );
}
