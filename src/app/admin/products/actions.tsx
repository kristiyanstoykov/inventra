'use server';

import { deleteProduct } from '@/drizzle/queries/products';
import { redirect } from 'next/navigation';

export async function deleteProductAction(formData: FormData) {
  const id = parseInt(formData.get('id') as string, 10);
  if (!id) return;
  const searchParams = formData.get('searchParams') as string;
  const result = await deleteProduct(id);
  const redirectUrl =
    searchParams && searchParams.length > 0 ? `/admin/products?${searchParams}` : '/admin/products';
  console.log('Redirecting to:', redirectUrl);
  redirect(redirectUrl);
}
