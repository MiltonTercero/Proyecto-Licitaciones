import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { dataStore } from '@/lib/storage/store';

export async function GET(req: Request) {
  try {
    // RBAC: Solo Admin puede ver auditoría del sistema
    const auth = requireAuth(req, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || undefined;
    const action = searchParams.get('action') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const logs = await dataStore.getAuditLogs({
      userId,
      action,
      startDate,
      endDate,
      limit,
    });

    return NextResponse.json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error('[AUDIT:GET] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al consultar registros de auditoría.',
        code: 'AUDIT_FETCH_ERROR',
      },
      { status: 500 }
    );
  }
}
