import { getUserFromSession } from '@/auth/core/session';
import { userEditSchema, userSchema } from '@/components/users/schema';
import { addRoleToUser, updateUserRole } from '@/drizzle/queries/roles';
import { createUser, deleteUser, updateUser } from '@/drizzle/queries/users';
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

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();

    const parsed = userSchema.safeParse(formData);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input: ' + JSON.stringify(parsed.error),
          errors: JSON.stringify(parsed.error),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const result = await createUser(data);
    if (result instanceof AppError) {
      return NextResponse.json({ success: false, message: result.toString() }, { status: 500 });
    }

    const newUserId = result;
    // Insert user role connection
    if (data.roleId) {
      await addRoleToUser(newUserId, parseInt(data.roleId.toString()));
    }

    return NextResponse.json({ success: true, message: 'User created.' }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Unexpected error.' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const user = await getUserFromSession(cookies);

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
    }

    const formData = await request.formData();
    const dataObj: Record<string, any> = {};
    formData.forEach((value, key) => {
      dataObj[key] = value;
    });
    const parsed = userEditSchema.safeParse(dataObj);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid input: ' + JSON.stringify(parsed.error),
          errors: JSON.stringify(parsed.error),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;
    if (!data.id) {
      return NextResponse.json(
        { success: false, message: 'User ID is required for update.' },
        { status: 400 }
      );
    }

    // You need to implement updateUser in your queries/users file
    const { id, roleId, ...userData } = data;
    const result = await updateUser(Number(id), userData);

    if (result instanceof AppError) {
      return NextResponse.json({ success: false, message: result.toString() }, { status: 500 });
    }

    // Optionally update user role if provided
    if (roleId) {
      await updateUserRole(Number(id), Number(roleId));
    }

    return NextResponse.json({ success: true, message: 'User updated.' }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Unexpected error.' }, { status: 500 });
  }
}
