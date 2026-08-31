import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { comparePassword, validatePasswordStrength } from '@/lib/auth/password';
import { generateAccessToken, generateRefreshToken } from '@/lib/auth/jwt';
import {
  checkLoginRateLimit,
  recordFailedLogin,
  resetLoginAttempts,
  getClientIp,
} from '@/lib/auth/rate-limiter';
import { logAudit } from '@/lib/audit/audit-logger';

// Regex completa para validación de email en backend
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export async function POST(req: Request) {
  const ip = getClientIp(req);
  const timestamp = new Date().toISOString();

  try {
    let body: any;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Cuerpo de solicitud inválido o malformado.',
          code: 'BAD_REQUEST',
        },
        { status: 400 }
      );
    }

    const { email, password } = body || {};

    // 1. Rate Limiting Check (por IP y por Email)
    const rateLimitKey = `${ip}:${(email || '').trim().toLowerCase()}`;
    const rateLimitStatus = checkLoginRateLimit(rateLimitKey);

    if (!rateLimitStatus.allowed) {
      console.log(
        `[${timestamp}] [WARN] [AUTH:LOGIN_BLOCKED] IP: ${ip} | Key: ${rateLimitKey} | Lockout: ${rateLimitStatus.lockoutMinutes}m`
      );
      await logAudit({
        userEmail: email || 'UNKNOWN',
        action: 'LOGIN_RATE_LIMITED',
        ipAddress: ip,
        newValues: { lockoutMinutes: rateLimitStatus.lockoutMinutes },
      });

      return NextResponse.json(
        {
          success: false,
          message: `Demasiados intentos fallidos. Su cuenta o IP ha sido bloqueada temporalmente por ${rateLimitStatus.lockoutMinutes || 30} minutos.`,
          code: 'TOO_MANY_REQUESTS',
        },
        { status: 429 }
      );
    }

    // 2. Validación de Entrada
    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      recordFailedLogin(rateLimitKey);
      await logAudit({
        userEmail: email || 'INVALID_FORMAT',
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        newValues: { reason: 'Formato de email inválido o inyección detectada' },
      });

      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    if (!password || typeof password !== 'string') {
      recordFailedLogin(rateLimitKey);
      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // 3. Consulta parametrizada a la Base de Datos (Segura contra SQL Injection)
    const user = await dataStore.getUserByEmail(email.trim());

    if (!user || !user.is_active) {
      const lockResult = recordFailedLogin(rateLimitKey);
      await logAudit({
        userEmail: email.trim(),
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        newValues: { reason: 'Usuario no existe o está inactivo', locked: lockResult.locked },
      });

      if (lockResult.locked) {
        return NextResponse.json(
          {
            success: false,
            message: `Demasiados intentos fallidos. Su acceso ha sido bloqueado por ${lockResult.lockoutMinutes} minutos.`,
            code: 'TOO_MANY_REQUESTS',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // 4. Comparación de Hash Bcrypt (Segura contra Timing Attacks)
    const passwordMatch = await comparePassword(password, user.password_hash);

    if (!passwordMatch) {
      const lockResult = recordFailedLogin(rateLimitKey);
      await logAudit({
        userId: user.id,
        userEmail: user.email,
        action: 'LOGIN_FAILED',
        ipAddress: ip,
        newValues: { reason: 'Contraseña incorrecta', locked: lockResult.locked },
      });

      if (lockResult.locked) {
        return NextResponse.json(
          {
            success: false,
            message: `Demasiados intentos fallidos. Su acceso ha sido bloqueado por ${lockResult.lockoutMinutes} minutos.`,
            code: 'TOO_MANY_REQUESTS',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          message: 'Credenciales inválidas.',
          code: 'INVALID_CREDENTIALS',
        },
        { status: 401 }
      );
    }

    // 5. Login Exitoso: Resetear intentos de Rate Limiting
    resetLoginAttempts(rateLimitKey);
    await dataStore.updateLastLogin(user.id);

    // 6. Generar Tokens JWT
    const payload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken({ userId: user.id });

    // 7. Auditoría de inicio de sesión exitoso
    await logAudit({
      userId: user.id,
      userEmail: user.email,
      action: 'LOGIN_SUCCESS',
      ipAddress: ip,
      newValues: { role: user.role },
    });

    // 8. Responder con Cookies HttpOnly y Body
    const response = NextResponse.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
        },
        accessToken,
        refreshToken,
      },
    });

    // Guardar token en cookie segura HttpOnly
    response.cookies.set('csc_access_token', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60, // 1 hora
      path: '/',
    });

    response.cookies.set('csc_refresh_token', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 días
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error(`[${timestamp}] [ERROR] [AUTH:LOGIN]`, error);
    return NextResponse.json(
      {
        success: false,
        message: 'Ocurrió un error inesperado al procesar el inicio de sesión.',
        code: 'INTERNAL_SERVER_ERROR',
      },
      { status: 500 }
    );
  }
}
