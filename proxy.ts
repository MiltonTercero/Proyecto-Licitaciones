import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * proxy.ts — Primera línea de defensa a nivel de servidor (Next.js 16+).
 *
 * Reemplaza al deprecado middleware.ts.
 * Protege rutas de página y de API validando la cookie HttpOnly de sesión.
 *
 * Flujo:
 *  - /login        → pública; si ya tiene cookie válida → redirect /
 *  - /api/auth/*   → pública (login, logout, me)
 *  - /api/cron/*   → pública (cron jobs internos)
 *  - resto /api/*  → requiere cookie O header Authorization: Bearer <token>
 *  - resto páginas → requiere cookie; si no tiene → redirect /login
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
  const cookieToken = request.cookies.get('csc_access_token')?.value;
  const authHeader  = request.headers.get('authorization') ?? '';
  const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  const hasToken    = Boolean(cookieToken || bearerToken);

  // Rutas de API privadas sin token → 401
  if (pathname.startsWith('/api/') && !hasToken) {
    return NextResponse.json(
      {
        success: false,
        message: 'No autorizado. Inicia sesión para continuar.',
        code: 'UNAUTHORIZED',
      },
      { status: 401 }
    );
  }

  // Páginas privadas sin cookie → redirigir a /login
  if (!pathname.startsWith('/api/') && !cookieToken) {
    return NextResponse.redirect(new URL('/login', request.url));
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
