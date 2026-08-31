interface LoginAttemptRecord {
  failedAttempts: number;
  firstAttemptAt: number;
  lockedUntil: number | null;
}

interface GlobalRateRecord {
  count: number;
  windowStart: number;
}

// Almacenes en memoria para rate limiting
const loginAttemptsMap = new Map<string, LoginAttemptRecord>();
const globalRequestsMap = new Map<string, GlobalRateRecord>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_ATTEMPT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutos de bloqueo

const GLOBAL_MAX_REQUESTS = 100;
const GLOBAL_WINDOW_MS = 60 * 1000; // 1 minuto

/**
 * Obtiene la IP del cliente a partir de los headers estándar de la petición
 */
export function getClientIp(req: Request): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  return '127.0.0.1';
}

/**
 * Verifica si el intento de login está bloqueado o permitido
 */
export function checkLoginRateLimit(key: string): {
  allowed: boolean;
  remainingAttempts: number;
  lockoutMinutes?: number;
} {
  const now = Date.now();
  const record = loginAttemptsMap.get(key);

  if (!record) {
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Si está bloqueado actualmente
  if (record.lockedUntil && now < record.lockedUntil) {
    const remainingMs = record.lockedUntil - now;
    const remainingMin = Math.ceil(remainingMs / 60000);
    return {
      allowed: false,
      remainingAttempts: 0,
      lockoutMinutes: remainingMin,
    };
  }

  // Si la ventana de tiempo ya expiró, reiniciar
  if (now - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttemptsMap.delete(key);
    return { allowed: true, remainingAttempts: MAX_LOGIN_ATTEMPTS };
  }

  // Si aún está dentro de los intentos permitidos
  const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - record.failedAttempts);
  return {
    allowed: record.failedAttempts < MAX_LOGIN_ATTEMPTS,
    remainingAttempts: remaining,
  };
}

/**
 * Registra un intento de login fallido
 */
export function recordFailedLogin(key: string): { locked: boolean; lockoutMinutes?: number } {
  const now = Date.now();
  const record = loginAttemptsMap.get(key);

  if (!record || now - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
    loginAttemptsMap.set(key, {
      failedAttempts: 1,
      firstAttemptAt: now,
      lockedUntil: null,
    });
    return { locked: false };
  }

  record.failedAttempts += 1;

  if (record.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
    record.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptsMap.set(key, record);
    return { locked: true, lockoutMinutes: 30 };
  }

  loginAttemptsMap.set(key, record);
  return { locked: false };
}

/**
 * Resetea los intentos de login tras un inicio de sesión exitoso
 */
export function resetLoginAttempts(key: string): void {
  loginAttemptsMap.delete(key);
}

/**
 * Verifica el rate limit global por IP (100 peticiones por minuto)
 */
export function checkGlobalRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = globalRequestsMap.get(ip);

  if (!record || now - record.windowStart > GLOBAL_WINDOW_MS) {
    globalRequestsMap.set(ip, { count: 1, windowStart: now });
    return { allowed: true, remaining: GLOBAL_MAX_REQUESTS - 1 };
  }

  if (record.count >= GLOBAL_MAX_REQUESTS) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  globalRequestsMap.set(ip, record);
  return { allowed: true, remaining: GLOBAL_MAX_REQUESTS - record.count };
}

// Limpieza periódica de memoria cada 10 minutos
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of loginAttemptsMap.entries()) {
    if (record.lockedUntil && now > record.lockedUntil) {
      loginAttemptsMap.delete(key);
    } else if (now - record.firstAttemptAt > LOGIN_ATTEMPT_WINDOW_MS) {
      loginAttemptsMap.delete(key);
    }
  }
  for (const [ip, record] of globalRequestsMap.entries()) {
    if (now - record.windowStart > GLOBAL_WINDOW_MS) {
      globalRequestsMap.delete(ip);
    }
  }
}, 10 * 60 * 1000);
