import { getUserFromSession } from '@/auth/core/session';
import { deleteCategory } from '@/drizzle/queries/categories';
import { AppError } from '@/lib/appError';
import { empty } from '@/lib/empty';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const user = await getUserFromSession(cookies);

    if (empty(user) || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: No sufficient privileges to delete products.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const id = formData.get('id');

    if (empty(id)) {
      return NextResponse.json(
        { success: false, message: 'Category ID is required.' },
        { status: 400 }
      );
    }

    const result = await deleteCategory(parseInt(id.toString()));

    if (result instanceof AppError) {
      return NextResponse.json({ success: false, message: result.toString() }, { status: 500 });
    }

    return NextResponse.json(
      { success: true, message: `Category #${id} deleted successfully` },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected error.' }, { status: 500 });
  }
}
