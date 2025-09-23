import { AppError } from '@/lib/appError';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card';
import Link from 'next/link';
import { getBrandById } from '@/db/drizzle/queries/brands';
import { BrandForm, BrandType } from '@/components/brands/brand-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Edit Brand',
};

type PageProps = {
  params: {
    id: string;
  };
};

export default async function EditBrandPage({ params }: PageProps) {
  const { id } = await params;
  const brand: Pick<BrandType, 'id' | 'name' | 'website'> | AppError =
    await getBrandById(Number(id));

  if (brand instanceof AppError) {
    return (
      <div className="flex justify-center mt-10">
        <Card className="max-w-[500px] w-full">
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription>{brand.toString()}</CardDescription>
            <div className="mt-4">
              <Link
                href="/admin/products/brands"
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
          href="/admin/products/brands"
          className="text-blue-600 hover:underline"
        >
          &larr; Go back
        </Link>
      </div>
      <Card className="max-w-[500px] w-full">
        <CardHeader>
          <CardTitle>Edit brand (ID #{brand.id})</CardTitle>
        </CardHeader>
        <CardContent>
          <BrandForm brand={brand} />
        </CardContent>
      </Card>
    </div>
  );
}
