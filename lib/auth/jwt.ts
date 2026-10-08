import jwt from 'jsonwebtoken';
import { RoleType } from '@/lib/types/database';

const JWT_SECRET = process.env.JWT_SECRET || '45eb871102090d108371f2f8df9d8b94c592341e739b1748ddb23ca2f6f9cca83f274e14e0e49fdf842f6a2c4096a0500d62bd444163f0a07c2e842e1a432838';
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hora
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 días

export interface JWTPayload {
  userId: string;
  email: string;
  role: RoleType;
  fullName?: string;
}

export type VerifyTokenResult =
  | { success: true; payload: JWTPayload }
  | { success: false; errorType: 'TokenExpiredError' | 'JsonWebTokenError' | 'NoToken'; message: string };

/**
 * Genera un Access Token JWT (válido por 1 hora) con algoritmo explícito HS256
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY, algorithm: 'HS256' });
}

/**
 * Genera un Refresh Token JWT (válido por 7 días) con algoritmo explícito HS256
 */
export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY, algorithm: 'HS256' });
}

/**
 * Valida el token con jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }).
 * Retorna resultado detallado clasificando TokenExpiredError, JsonWebTokenError y NoToken.
 */
export function verifyAccessTokenDetailed(token: string | null | undefined): VerifyTokenResult {
  if (!token || typeof token !== 'string' || token.trim() === '') {
    return { success: false, errorType: 'NoToken', message: 'No autenticado' };
  }

  try {
    const decoded = jwt.verify(token.trim(), JWT_SECRET, { algorithms: ['HS256'] }) as JWTPayload;
    return { success: true, payload: decoded };
  } catch (err: any) {
    if (err?.name === 'TokenExpiredError') {
      return { success: false, errorType: 'TokenExpiredError', message: 'Token expirado' };
    }
    return { success: false, errorType: 'JsonWebTokenError', message: 'Token inválido' };
  }
}

/**
 * Verifica y decodifica un Access Token JWT usando HS256
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  const result = verifyAccessTokenDetailed(token);
  return result.success ? result.payload : null;
}

/**
 * Verifica un Refresh Token JWT usando HS256
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}
