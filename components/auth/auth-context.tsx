'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { RoleType } from '@/lib/types/database';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: RoleType;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  authFetch: (url: string, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); // true hasta leer localStorage
  const router = useRouter();
  const pathname = usePathname();

  // ── 1. Restaurar sesión al montar (sessionStorage / /api/auth/me) ─────────
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const savedToken = sessionStorage.getItem('csc_access_token') || localStorage.getItem('csc_access_token');
        const savedUser  = sessionStorage.getItem('csc_user') || localStorage.getItem('csc_user');

        if (savedToken && savedUser) {
          if (isMounted) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
            setLoading(false);
          }
          return;
        }

        // Verificar si existe sesión válida por cookie HttpOnly
        const meRes = await fetch('/api/auth/me');
        if (meRes.ok) {
          const meData = await meRes.json();
          if (meData.success && meData.data && isMounted) {
            setUser(meData.data);
            sessionStorage.setItem('csc_user', JSON.stringify(meData.data));
            setLoading(false);
            return;
          }
        }

        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } catch {
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  // ── 2. Guardia de redirección (después de que cargue) ─────────────────────
  useEffect(() => {
    if (loading) return;

    const isLoginPage = pathname === '/login';

    if (!user && !isLoginPage) {
      // No autenticado → enviar a login
      router.replace('/login');
    } else if (user && isLoginPage) {
      // Ya autenticado → no debe estar en login
      router.replace('/');
    }
  }, [user, loading, pathname, router]);

  // ── 3. Login ───────────────────────────────────────────────────────────────
  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message || 'Usuario o contraseña incorrectos.',
        };
      }

      const accessToken = data.data.accessToken;
      const authUser: AuthUser = {
        id:       data.data.user.id,
        email:    data.data.user.email,
        fullName: data.data.user.fullName || data.data.user.email,
        role:     data.data.user.role,
      };

      setToken(accessToken);
      setUser(authUser);
      sessionStorage.setItem('csc_access_token', accessToken);
      sessionStorage.setItem('csc_user', JSON.stringify(authUser));
      // Limpiar remanentes de localStorage
      localStorage.removeItem('csc_access_token');
      localStorage.removeItem('csc_user');

      return { success: true };
    } catch {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor de autenticación.',
      };
    }
  };

  // ── 4. Logout ──────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // ignorar errores de red en logout
    } finally {
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('csc_access_token');
      sessionStorage.removeItem('csc_user');
      localStorage.removeItem('csc_access_token');
      localStorage.removeItem('csc_user');
      router.replace('/login');
    }
  };

  // ── 5. authFetch ───────────────────────────────────────────────────────────
  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (token) headers.set('Authorization', `Bearer ${token}`);
    return fetch(url, { ...init, headers });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de un AuthProvider');
  return ctx;
}
