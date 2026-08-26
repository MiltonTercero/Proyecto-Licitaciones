'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileSpreadsheet,
  PlusCircle,
  Building2,
  Package,
  History,
  ShieldCheck,
  Briefcase,
  HelpCircle,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    {
      href: '/',
      label: 'Panel Principal',
      icon: LayoutDashboard,
      description: 'KPIs y estado general',
    },
    {
      href: '/licitaciones',
      label: 'Licitaciones',
      icon: FileSpreadsheet,
      description: 'Gestión y ciclo comercial',
    },
    {
      href: '/licitaciones/nueva',
      label: 'Nueva Licitación',
      icon: PlusCircle,
      description: 'Asistente guiado de creación',
    },
    {
      href: '/clientes',
      label: 'Empresas Clientes',
      icon: Building2,
      description: 'Directorio y contactos',
    },
    {
      href: '/productos',
      label: 'Catálogo Productos',
      icon: Package,
      description: 'Precios y especificaciones',
    },
    {
      href: '/auditoria',
      label: 'Auditoría & Trazabilidad',
      icon: History,
      description: 'Línea de tiempo de cambios',
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div>
        {/* Brand */}
        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-md shadow-blue-500/20">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none">
              CSC Licitaciones
            </h1>
            <p className="text-[11px] text-zinc-500 mt-1 font-medium">
              Consultoría & Soluciones
            </p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
            Módulos del Sistema
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/'
                ? pathname === '/'
                : pathname.startsWith(item.href) && item.href !== '/licitaciones'
                ? true
                : pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-bold shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'}`} />
                <div className="truncate">
                  <div>{item.label}</div>
                  <div className="text-[10px] font-normal opacity-70 truncate">
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 m-3 rounded-xl">
        <div className="flex items-center gap-2 mb-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
            Ambiente Conectado
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 leading-tight">
          Next.js + Supabase + Resend + Vercel Cron Jobs.
        </p>
      </div>
    </aside>
  );
}
