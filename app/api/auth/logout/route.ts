import { NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';

export async function POST(req: Request) {
  try {
    const userPayload = authenticateRequest(req);
    const ip = getClientIp(req);

    if (userPayload) {
      await logAudit({
        userId: userPayload.userId,
        userEmail: userPayload.email,
        action: 'LOGOUT',
        ipAddress: ip,
      });
    }

    const response = NextResponse.json({
      success: true,
      message: 'Sesión cerrada exitosamente',
    });

    response.cookies.delete('csc_access_token');
    response.cookies.delete('csc_refresh_token');

    return response;
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: 'Error al cerrar sesión',
      },
      { status: 500 }
    );
  }
}
