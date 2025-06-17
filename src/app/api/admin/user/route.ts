import { getUserFromSession } from '@/auth/core/session';
import { userSchema } from '@/components/users/schema';
import { deleteUser } from '@/drizzle/queries/users';
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

    if (parseInt(id.toString()) === user.id) {
      return NextResponse.json(
        { success: false, message: 'You cannot delete your own account at the moment.' },
        { status: 500 }
      );
    }

    const result = await deleteUser(parseInt(id.toString()));

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

export async function POST(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const user = await getUserFromSession(cookies);

    if (empty(user) || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: No sufficient privileges to create users.',
        },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const data: Record<string, any> = {};
    formData.forEach((value, key) => {
      data[key] = value;
    });

    // Validate input using userSchema
    const parseResult = userSchema.safeParse(data);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, message: 'Invalid user data.', errors: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    // Replace this with your actual user creation logic
    const result = new AppError('This action is not implemented yet.', 'context');
    if (result instanceof AppError) {
      return NextResponse.json({ success: false, message: result.toString() }, { status: 500 });
    }

    // Optionally revalidate path or perform other actions

    return NextResponse.json(
      { success: true, message: 'User created successfully.' },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ success: false, message: 'Unexpected error.' }, { status: 500 });
  }
}
