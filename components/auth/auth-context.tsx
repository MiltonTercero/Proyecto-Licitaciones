'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Restaurar sesión al cargar
  useEffect(() => {
    const savedToken = localStorage.getItem('csc_access_token');
    const savedUser = localStorage.getItem('csc_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('csc_access_token');
        localStorage.removeItem('csc_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
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
        id: data.data.user.id,
        email: data.data.user.email,
        fullName: data.data.user.fullName || data.data.user.email,
        role: data.data.user.role,
      };

      setToken(accessToken);
      setUser(authUser);
      localStorage.setItem('csc_access_token', accessToken);
      localStorage.setItem('csc_user', JSON.stringify(authUser));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        message: 'No se pudo conectar con el servidor de autenticación.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('csc_access_token');
      localStorage.removeItem('csc_user');
      router.push('/login');
    }
  };

  // Helper para hacer llamadas autenticadas con el header Authorization
  const authFetch = async (url: string, init?: RequestInit): Promise<Response> => {
    const headers = new Headers(init?.headers || {});
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(url, {
      ...init,
      headers,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
}
