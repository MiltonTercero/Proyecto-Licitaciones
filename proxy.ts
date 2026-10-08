import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAccessTokenDetailed } from '@/lib/auth/jwt';

/**
 * proxy.ts — Primera línea de defensa perimetral a nivel de servidor (Next.js 16+).
 *
 * Valida criptográficamente el JWT (firma, expiración, algoritmo HS256).
 *
 * Flujo:
 *  - /login        → pública
 *  - /api/auth/*   → pública (login, logout, me)
 *  - /api/cron/*   → pública / protegida por cron secret
 *  - resto /api/*  → requiere Bearer <token> o cookie mt_access_token válida con HS256
 *  - resto páginas → requiere cookie mt_access_token válida con HS256; si no → redirect /login
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Rutas completamente públicas ──────────────────────────────────────────
  const isAuthRoute = pathname.startsWith('/api/auth/');
  const isCronRoute = pathname.startsWith('/api/cron/');
  const isLoginPage = pathname === '/login';

  // Si visita /login → siempre permitir que cargue la página
  if (isLoginPage) {
    return NextResponse.next();
  }

  // Rutas de API de auth y cron: pasar sin restricción
  if (isAuthRoute || isCronRoute) {
    return NextResponse.next();
  }

  // ── Para el resto: verificar autenticación ────────────────────────────────
  const authHeader = request.headers.get('authorization') ?? '';
  let token: string | null = null;

  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          {
            success: false,
            message: 'Token inválido',
            code: 'JsonWebTokenError',
          },
          { status: 401 }
        );
      }
    } else {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) {
    token = request.cookies.get('mt_access_token')?.value || null;
  }

  // Rutas de API privadas
  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message: 'No autenticado',
          code: 'NoToken',
        },
        { status: 401 }
      );
    }

    const verification = verifyAccessTokenDetailed(token);
    if (!verification.success) {
      return NextResponse.json(
        {
          success: false,
          message: verification.message, // "Token expirado" o "Token inválido"
          code: verification.errorType,
        },
        { status: 401 }
      );
    }

    return NextResponse.next();
  }

  // Páginas privadas sin token válido → redirigir a /login
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const pageVerification = verifyAccessTokenDetailed(token);
  if (!pageVerification.success) {
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.cookies.delete('mt_access_token');
    return redirectResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplicar a todas las rutas excepto:
     * - _next/static  (archivos estáticos)
     * - _next/image   (optimización de imágenes)
     * - favicon.ico
     * - archivos de imagen públicos (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
