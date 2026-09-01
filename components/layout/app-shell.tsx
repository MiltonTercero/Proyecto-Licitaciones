'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import { SidebarProvider } from './sidebar-context';
import { Sidebar } from './sidebar';
import { Loader2, Briefcase } from 'lucide-react';

/**
 * AppShell — Capa de presentación que protege el contenido privado.
 *
 * Reglas:
 * - /login → solo muestra `children` sin sidebar.
 * - Cualquier otra ruta:
 *   - Si loading → spinner (nunca se muestra contenido privado).
 *   - Si no autenticado → spinner "redirigiendo…" (el guard en AuthProvider redirige).
 *   - Si autenticado → sidebar + contenido.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();

  const isLoginPage = pathname === '/login';

  // Página pública (login): renderizar sin sidebar ni protección
  if (isLoginPage) {
    return <>{children}</>;
  }

  // Mientras se verifica la sesión: spinner de pantalla completa
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Briefcase className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
          <span>Verificando credenciales de acceso…</span>
        </div>
      </div>
    );
  }

  // Sin sesión y fuera de /login: pantalla en blanco mientras AuthProvider redirige
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 gap-4">
        <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Briefcase className="w-7 h-7" aria-hidden="true" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" aria-hidden="true" />
          <span>Redirigiendo a inicio de sesión…</span>
        </div>
      </div>
    );
  }

  // Usuario autenticado: renderizar layout completo con sidebar
  return (
    <SidebarProvider>
      <Sidebar />
      <div className="min-h-screen flex flex-col w-full">
        {children}
      </div>
    </SidebarProvider>
  );
}
