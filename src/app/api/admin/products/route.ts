import { NextRequest, NextResponse } from 'next/server';
import { deleteProduct } from '@/drizzle/queries/products';
import { AppError } from '@/lib/appError';
import { getUserFromSession } from '@/auth/core/session';

export async function DELETE(req: NextRequest) {
  const cookies = req.cookies;
  const user = await getUserFromSession(cookies);

  if (!user || user.role !== 'admin') {
    return NextResponse.json(
      {
        success: false,
        message: 'Unauthorized: No sufficient privileges to delete products.',
      },
      { status: 401 }
    );
  }

  const formData = await req.formData();
  const idValue = formData.get('id');
  const id = typeof idValue === 'string' ? parseInt(idValue, 10) : NaN;

  if (!id) {
    return NextResponse.json({ success: false, message: 'Invalid ID' }, { status: 400 });
  }

  const result = await deleteProduct(id);

  if (result instanceof AppError) {
    return NextResponse.json({ success: false, message: result.toString() }, { status: 500 });
  }

  return NextResponse.json(
    { success: true, message: `Product ${id} deleted successfully` },
    { status: 200 }
  );
}
