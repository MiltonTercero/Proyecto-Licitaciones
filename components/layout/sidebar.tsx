'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSidebar } from './sidebar-context';
import { useAuth } from '@/components/auth/auth-context';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Building2,
  Package,
  History,
  Briefcase,
  Users as UsersIcon,
  X,
  ShieldCheck,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { isOpen, closeSidebar } = useSidebar();
  const { user } = useAuth();

  const role = user?.role;
  const isAdmin = role === 'admin';
  const isGestor = role === 'gestor';
  const isVisualizador = role === 'visualizador';

  const navItems = [
    {
      href: '/',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      visible: true,
    },
    {
      href: '/licitaciones',
      label: 'Licitaciones',
      icon: FileSpreadsheet,
      visible: true,
    },
    {
      href: '/licitaciones/nueva',
      label: 'Crear Licitación',
      icon: PlusCircle,
      isAccent: true,
      visible: true, // todos pueden crear
    },
    {
      href: '/clientes',
      label: 'Clientes',
      icon: Building2,
      visible: true,
    },
    {
      href: '/productos',
      label: 'Catálogo',
      icon: Package,
      visible: true,
    },
    // ── Sección Admin exclusiva ──────────────────────────────────
    {
      href: '/admin/users',
      label: 'Usuarios & Roles',
      icon: UsersIcon,
      adminOnly: true,
      visible: isAdmin,
    },
    {
      href: '/admin/audit',
      label: 'Auditoría del Sistema',
      icon: History,
      adminOnly: true,
      visible: isAdmin,
    },
  ];

  const visibleItems = navItems.filter((i) => i.visible);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
        />
      )}

      {/* Drawer con contenedor de altura completa y distribución flex */}
      <aside
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 sm:w-96 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full max-h-screen overflow-hidden transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Menú de navegación lateral"
        role="navigation"
      >
        {/* Header (Fijo arriba) */}
        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-xl shadow-md shadow-blue-500/20">
              <Briefcase className="w-6 h-6" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-base font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
                CSC Licitaciones
              </h1>
              <p className="text-xs text-zinc-500 mt-1 font-medium">
                Gestión Comercial & Control
              </p>
            </div>
          </div>
          <button
            onClick={closeSidebar}
            className="p-2.5 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Contenedor central con SCROLL SUAVE y visible */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-2 [scrollbar-width:thin] [scrollbar-color:rgba(156,163,175,0.5)_transparent]">
          <nav className="space-y-1.5 pb-2">
            <div className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              Navegación
            </div>

            {visibleItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closeSidebar}
                  className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-sm sm:text-base font-bold transition-all ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 shadow-sm border border-blue-100 dark:border-blue-900'
                      : item.isAccent
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-950 dark:hover:text-zinc-50'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <div
                    className={`p-2 rounded-xl transition-colors ${
                      isActive
                        ? 'bg-blue-600 text-white'
                        : item.isAccent
                        ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                    }`}
                    aria-hidden="true"
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                  </div>
                  <span className="truncate">{item.label}</span>
                  {item.adminOnly && (
                    <span className="ml-auto text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-100 dark:bg-violet-950/60 text-violet-700 dark:text-violet-400 font-bold flex items-center gap-0.5">
                      <ShieldCheck className="w-2.5 h-2.5" aria-hidden="true" />
                      Admin
                    </span>
                  )}
                </Link>
              );
            })}

            {/* Aviso de permisos contextual para Gestor */}
            {isGestor && (
              <div className="mt-4 mx-1 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
                <strong className="block mb-0.5">Acceso Gestor</strong>
                Tienes permiso para consultar, crear y modificar Licitaciones, Clientes y Catálogo. Las secciones de <em>Usuarios</em> y <em>Auditoría</em> son exclusivas de Administrador.
              </div>
            )}

            {/* Aviso de permisos contextual para Visualizador */}
            {isVisualizador && (
              <div className="mt-4 mx-1 p-3 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-[11px] text-blue-800 dark:text-blue-300 leading-relaxed">
                <strong className="block mb-0.5">Acceso Visualizador</strong>
                Puedes crear nuevas licitaciones. La edición y eliminación de clientes, productos y licitaciones activas están deshabilitadas para tu rol.
              </div>
            )}
          </nav>
        </div>

        {/* Footer (Fijo abajo) */}
        <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/80 flex items-center justify-between text-xs text-zinc-500 shrink-0">
          <div>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">CSC Licitaciones v1.0</p>
            {user && (
              <p className="text-[10px] mt-0.5">
                Sesión:{' '}
                <span className="font-bold capitalize text-zinc-600 dark:text-zinc-400">
                  {user.role}
                </span>
              </p>
            )}
          </div>
          <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md font-bold">
            RBAC Activo
          </span>
        </div>
      </aside>
    </>
  );
}
