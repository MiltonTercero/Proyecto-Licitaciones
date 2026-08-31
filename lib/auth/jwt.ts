import jwt from 'jsonwebtoken';
import { RoleType } from '@/lib/types/database';

const JWT_SECRET = process.env.JWT_SECRET || 'csc-licitaciones-jwt-super-secret-key-2026-secure';
const ACCESS_TOKEN_EXPIRY = '1h'; // 1 hora
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 días

export interface JWTPayload {
  userId: string;
  email: string;
  role: RoleType;
  fullName?: string;
}

/**
 * Genera un Access Token JWT (válido por 1 hora)
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

/**
 * Genera un Refresh Token JWT (válido por 7 días)
 */
export function generateRefreshToken(payload: { userId: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

/**
 * Verifica y decodifica un Access Token JWT
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verifica un Refresh Token JWT
 */
export function verifyRefreshToken(token: string): { userId: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    return decoded;
  } catch {
    return null;
  }
}
