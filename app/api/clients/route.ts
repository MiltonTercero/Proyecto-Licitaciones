import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { requireAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';

export async function GET(req: Request) {
  try {
    const clients = await dataStore.getClients();
    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'CLIENTS_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  try {
    // RBAC: Admin y Gestor pueden crear clientes
    const auth = requireAuth(req, ['admin', 'gestor']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await req.json();
    if (!body.name || !body.tax_id || !body.email) {
      return NextResponse.json(
        {
          success: false,
          message: 'Razón social, RUC/NIT y correo electrónico son obligatorios.',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const newClient = await dataStore.createClient({
      ...body,
      created_by: auth.user!.userId,
    });

    // Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'CREATE_CLIENT',
      tableName: 'clients',
      recordId: newClient.id,
      newValues: newClient,
      ipAddress: ip,
    });

    return NextResponse.json(
      { success: true, message: 'Cliente creado con éxito', data: newClient },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'CLIENT_CREATE_ERROR' },
      { status: 400 }
    );
  }
}
