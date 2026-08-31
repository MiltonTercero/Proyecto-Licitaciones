import { NextResponse } from 'next/server';
import { verifyAccessToken, JWTPayload } from './jwt';
import { RoleType } from '@/lib/types/database';
import { getClientIp, checkGlobalRateLimit } from './rate-limiter';

export interface AuthResult {
  authenticated: boolean;
  user: JWTPayload | null;
  errorResponse?: NextResponse;
}

/**
 * Extrae y valida el JWT de la petición (desde header Authorization o cookie)
 */
export function authenticateRequest(req: Request): JWTPayload | null {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/csc_access_token=([^;]+)/);
      if (match) {
        token = match[1];
      }
    }
  }

  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * Middleware para proteger rutas API verificando autenticación y roles RBAC
 */
export function requireAuth(
  req: Request,
  allowedRoles?: RoleType[]
): AuthResult {
  const ip = getClientIp(req);

  // 1. Rate limiting global (100 req/min)
  const rateLimit = checkGlobalRateLimit(ip);
  if (!rateLimit.allowed) {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: 'Demasiadas solicitudes. Por favor intente más tarde.',
          code: 'RATE_LIMIT_EXCEEDED',
        },
        { status: 429 }
      ),
    };
  }

  // 2. Verificar token JWT
  const user = authenticateRequest(req);
  if (!user) {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: 'No autorizado. Debe iniciar sesión para acceder a este recurso.',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  // 3. Verificar Roles (RBAC) si se especificaron
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(user.role)) {
      return {
        authenticated: true,
        user,
        errorResponse: NextResponse.json(
          {
            success: false,
            message: 'Acceso denegado. No posee los permisos necesarios para esta acción.',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        ),
      };
    }
  }

  return { authenticated: true, user };
}
