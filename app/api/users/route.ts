import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { dataStore } from '@/lib/storage/store';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';
import { RoleType } from '@/lib/types/database';

// Regex para validación de email
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// GET /api/users - Solo Admin
export async function GET(req: Request) {
  try {
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const users = await dataStore.getUsers();
    // Excluir password_hash de la respuesta
    const sanitizedUsers = users.map((u) => {
      const { password_hash, ...rest } = u;
      return rest;
    });

    return NextResponse.json({
      success: true,
      data: sanitizedUsers,
    });
  } catch (error: any) {
    console.error('[USERS:GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al obtener la lista de usuarios.',
        code: 'USERS_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}

// POST /api/users - Solo Admin
export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Cuerpo de solicitud inválido.',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    const { email, password, role, full_name } = body;

    // 1. Validaciones
    if (!email || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        {
          success: false,
          message: 'El correo electrónico no tiene un formato válido.',
          code: 'INVALID_EMAIL',
        },
        { status: 400 }
      );
    }

    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: passwordValidation.message,
          code: 'WEAK_PASSWORD',
        },
        { status: 400 }
      );
    }

    const validRoles: RoleType[] = ['admin', 'gestor', 'visualizador'];
    if (!role || !validRoles.includes(role)) {
      return NextResponse.json(
        {
          success: false,
          message: 'El rol seleccionado no es válido (admin, gestor, visualizador).',
          code: 'INVALID_ROLE',
        },
        { status: 400 }
      );
    }

    // 2. Hash con bcrypt (salt rounds = 12)
    const password_hash = await hashPassword(password);

    // 3. Crear usuario
    const newUser = await dataStore.createUser({
      email: email.trim(),
      password_hash,
      role,
      full_name: full_name?.trim() || email.split('@')[0],
    });

    // 4. Registro en Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'CREATE_USER',
      tableName: 'users',
      recordId: newUser.id,
      newValues: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        full_name: newUser.full_name,
      },
      ipAddress: ip,
    });

    const { password_hash: _, ...sanitized } = newUser;

    return NextResponse.json(
      {
        success: true,
        message: 'Usuario creado exitosamente.',
        data: sanitized,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('[USERS:POST] Error:', error);
    if (error.message?.includes('ya se encuentra registrado')) {
      return NextResponse.json(
        {
          success: false,
          message: 'El correo electrónico ya está registrado.',
          code: 'DUPLICATE_EMAIL',
        },
        { status: 409 }
      );
    }
    return NextResponse.json(
      {
        success: false,
        message: 'Error al crear el usuario.',
        code: 'USER_CREATE_ERROR',
      },
      { status: 500 }
    );
  }
}
