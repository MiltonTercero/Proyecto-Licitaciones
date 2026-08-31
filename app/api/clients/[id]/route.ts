import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { requireAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const client = await dataStore.getClientById(id);
    if (!client) {
      return NextResponse.json(
        { success: false, message: 'Cliente no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: client });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);

  try {
    // RBAC: Solo Admin puede editar clientes
    const auth = requireAuth(request, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const oldClient = await dataStore.getClientById(id);
    if (!oldClient) {
      return NextResponse.json(
        { success: false, message: 'Cliente no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updated = await dataStore.updateClient(id, {
      ...body,
      updated_by: auth.user!.userId,
    });

    // Auditoría con old_values vs new_values
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'UPDATE_CLIENT',
      tableName: 'clients',
      recordId: id,
      oldValues: oldClient,
      newValues: updated,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'CLIENT_UPDATE_ERROR' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(_request);

  try {
    // RBAC: Solo Admin puede eliminar clientes
    const auth = requireAuth(_request, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const oldClient = await dataStore.getClientById(id);
    if (!oldClient) {
      return NextResponse.json(
        { success: false, message: 'Cliente no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await dataStore.deleteClient(id);

    // Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'DELETE_CLIENT',
      tableName: 'clients',
      recordId: id,
      oldValues: oldClient,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: 'Cliente eliminado con éxito' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'CLIENT_DELETE_ERROR' },
      { status: 400 }
    );
  }
}
