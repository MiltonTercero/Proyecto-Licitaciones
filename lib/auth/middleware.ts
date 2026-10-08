import { NextResponse } from 'next/server';
import { verifyAccessTokenDetailed, JWTPayload, VerifyTokenResult } from './jwt';
import { RoleType, User } from '@/lib/types/database';
import { getClientIp, checkGlobalRateLimit } from './rate-limiter';
import { dataStore } from '@/lib/storage/store';

export interface AuthResult {
  authenticated: boolean;
  user: JWTPayload | null;
  dbUser?: User | null;
  errorResponse?: NextResponse;
}

/**
 * Extrae y valida el JWT de la petición:
 * 1. Verifica header Authorization: si existe, debe comenzar con "Bearer ".
 * 2. Si no hay header Authorization, busca la cookie mt_access_token.
 * 3. Valida token y retorna el resultado detallado (TokenExpiredError, JsonWebTokenError, NoToken).
 */
export function extractAndVerifyToken(req: Request): VerifyTokenResult {
  const authHeader = req.headers.get('authorization');
  let token: string | null = null;

  if (authHeader) {
    if (!authHeader.startsWith('Bearer ')) {
      return { success: false, errorType: 'JsonWebTokenError', message: 'Token inválido' };
    }
    token = authHeader.slice(7).trim();
  }

  if (!token) {
    const cookieHeader = req.headers.get('cookie');
    if (cookieHeader) {
      const match = cookieHeader.match(/mt_access_token=([^;]+)/);
      if (match) {
        token = match[1].trim();
      }
    }
  }

  if (!token) {
    return { success: false, errorType: 'NoToken', message: 'No autenticado' };
  }

  return verifyAccessTokenDetailed(token);
}

/**
 * Función auxiliar para autenticar peticiones de forma simplificada
 */
export function authenticateRequest(req: Request): JWTPayload | null {
  const result = extractAndVerifyToken(req);
  return result.success ? result.payload : null;
}

/**
 * Middleware para proteger rutas API verificando autenticación, vigencia,
 * verificación contra BD y roles RBAC con defensas en profundidad.
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: RoleType[]
): Promise<AuthResult> {
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

  // 2. Extraer y verificar token JWT criptográficamente con HS256
  const tokenResult = extractAndVerifyToken(req);
  if (!tokenResult.success) {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: tokenResult.message, // "Token expirado", "Token inválido" o "No autenticado"
          code: tokenResult.errorType,
        },
        { status: 401 }
      ),
    };
  }

  const payload = tokenResult.payload;

  // 3. Verificar que el usuario exista y esté activo en la BD (defensa contra tokens huérfanos)
  let dbUser: User | null = null;
  try {
    dbUser = await dataStore.getUserById(payload.userId);
  } catch (err) {
    console.error('[requireAuth] Error verificando usuario en BD:', err);
    // Si la BD falla en responder la verificación, rechazamos por seguridad
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  if (!dbUser || !dbUser.is_active) {
    return {
      authenticated: false,
      user: null,
      errorResponse: NextResponse.json(
        {
          success: false,
          message: 'No autenticado',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      ),
    };
  }

  // 4. Adjuntar usuario decodificado a req (objeto de petición)
  (req as any).user = dbUser;

  // 5. Verificar Roles (RBAC) si se especificaron
  const effectiveRole = dbUser.role || payload.role;
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(effectiveRole)) {
      return {
        authenticated: true,
        user: payload,
        dbUser,
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

  return { authenticated: true, user: payload, dbUser };
}
