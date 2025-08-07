import { getUserFromSession } from '@/auth/core/session';
import { getAllRoles } from '@/drizzle/queries/roles';
import { AppError } from '@/lib/appError';
import { empty } from '@/lib/empty';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const cookies = request.cookies;
    const user = await getUserFromSession(cookies);

    if (empty(user) || user.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          message: 'Unauthorized: No sufficient privileges.',
        },
        { status: 401 }
      );
    }

    const roles = await getAllRoles();

    if (roles instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          message: roles.toString(),
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: roles, success: true }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
