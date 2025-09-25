import { AppError } from '@/lib/appError';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { ProductForm } from '@/components/products/products-add-form';
import { Heading } from '@/components/ui/heading';
import { Suspense } from 'react';
import { getAllCategories } from '@/db/drizzle/queries/categories';
import { getAllAttributesForSelect } from '@/db/drizzle/queries/attributes';
import { ProductSkeletonForm } from '@/components/products/products-skeleton-form ';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Metadata } from 'next';
import { getAllBrands } from '@/db/drizzle/queries/brands';

export const metadata: Metadata = {
  title: 'New Product',
};

export default async function NewProductPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center mt-4">
          <div className="w-[95%] max-w-full text-left">
            <Link
              href="/admin/products/"
              className="text-blue-800 hover:underline"
            >
              <ArrowLeft className="inline h-4" /> Go back
            </Link>
          </div>
          <Card className="w-[95%] animate-pulse">
            <CardHeader>
              <CardTitle>
                <Heading size="h3" as="h1">
                  New product <Loader2 className="inline animate-spin" />
                </Heading>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSkeletonForm />
            </CardContent>
          </Card>
        </div>
      }
    >
      <SuspendedPage />
    </Suspense>
  );
}

async function SuspendedPage() {
  let attributes = await getAllAttributesForSelect();
  let categories = await getAllCategories();
  const brands = await getAllBrands();;

  if (attributes instanceof AppError) {
    attributes = [];
  }

  if (categories instanceof AppError) {
    categories = [];
  }

  return (
    <div className="flex flex-col items-center mt-4">
      <div className="w-[95%] max-w-full text-left">
        <Link href="/admin/products/" className="text-blue-800 hover:underline">
          <ArrowLeft className="inline h-4" /> Go back
        </Link>
      </div>
      <Card className="w-[95%] m-2">
        <CardHeader>
          <CardTitle>
            <Heading size="h3" as="h1">
              New product
            </Heading>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ProductForm
            product={null}
            brands={brands}
            attributes={attributes.map((attr) => ({
              id: attr.id,
              name: attr.name,
            }))}
            categories={categories.map((cat) => ({
              id: cat.id,
              name: cat.name,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
