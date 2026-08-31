import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { dataStore } from '@/lib/storage/store';
import { hashPassword, validatePasswordStrength } from '@/lib/auth/password';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';
import { RoleType } from '@/lib/types/database';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const user = await dataStore.getUserById(id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const { password_hash, ...sanitized } = user;
    return NextResponse.json({ success: true, data: sanitized });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error al obtener usuario' },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);

  try {
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const existingUser = await dataStore.getUserById(id);

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { role, full_name, password, is_active } = body;

    const updates: any = {};
    if (role) updates.role = role as RoleType;
    if (full_name) updates.full_name = full_name.trim();
    if (is_active !== undefined) updates.is_active = Boolean(is_active);

    if (password) {
      const passValidation = validatePasswordStrength(password);
      if (!passValidation.valid) {
        return NextResponse.json(
          { success: false, message: passValidation.message, code: 'WEAK_PASSWORD' },
          { status: 400 }
        );
      }
      updates.password_hash = await hashPassword(password);
    }

    const updatedUser = await dataStore.updateUser(id, updates);

    // Registrar en auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'UPDATE_USER',
      tableName: 'users',
      recordId: id,
      oldValues: {
        role: existingUser.role,
        full_name: existingUser.full_name,
        is_active: existingUser.is_active,
      },
      newValues: {
        role: updatedUser.role,
        full_name: updatedUser.full_name,
        is_active: updatedUser.is_active,
        password_changed: !!password,
      },
      ipAddress: ip,
    });

    const { password_hash, ...sanitized } = updatedUser;
    return NextResponse.json({
      success: true,
      message: 'Usuario actualizado exitosamente.',
      data: sanitized,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(req);

  try {
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;

    // Regla de Negocio: Un admin NO puede eliminarse a sí mismo
    if (auth.user!.userId === id) {
      return NextResponse.json(
        {
          success: false,
          message: 'Regla de seguridad: Un administrador no puede eliminar su propia cuenta.',
          code: 'SELF_DELETION_FORBIDDEN',
        },
        { status: 400 }
      );
    }

    const existingUser = await dataStore.getUserById(id);
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'Usuario no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await dataStore.deleteUser(id);

    // Registro en auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'DELETE_USER',
      tableName: 'users',
      recordId: id,
      oldValues: {
        email: existingUser.email,
        role: existingUser.role,
        full_name: existingUser.full_name,
      },
      ipAddress: ip,
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
