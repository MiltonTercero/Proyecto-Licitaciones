import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { dataStore } from '@/lib/storage/store';

export async function GET(req: Request) {
  try {
    const userPayload = authenticateRequest(req);
    if (!userPayload) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const user = await dataStore.getUserById(userPayload.userId);
    if (!user || !user.is_active) {
      return NextResponse.json(
        {
          success: false,
          message: 'Usuario no encontrado o inactivo',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        fullName: user.full_name,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener sesión de usuario',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
