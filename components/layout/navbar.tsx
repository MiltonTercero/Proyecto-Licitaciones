'use client';

import React from 'react';
import { useSidebar } from './sidebar-context';
import {
  Menu,
  Search,
  RefreshCw,
  Briefcase,
} from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ onRefresh, isRefreshing }: NavbarProps) {
  const { toggleSidebar } = useSidebar();

  return (
    <header className="h-20 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      <div className="flex items-center gap-4 sm:gap-6 flex-1 max-w-xl">
        {/* Botón de Menú de Hamburguesa */}
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menú de navegación"
          className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center transition-all cursor-pointer shadow-2xs border border-zinc-200 dark:border-zinc-800"
          title="Abrir menú principal"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Barra de búsqueda ampliada y proporcionada */}
        <div className="relative w-full">
          <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar licitaciones por código, empresa o título..."
            className="w-full h-12 pl-12 pr-4 bg-zinc-100/80 dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl text-sm text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-zinc-800 transition-all"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4 pl-4">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Actualizar datos"
            className="w-11 h-11 rounded-2xl border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        <div className="h-8 w-px bg-zinc-200 dark:bg-zinc-800 mx-1 hidden sm:block" />

        {/* Sección de perfil ampliada y equilibrada */}
        <div className="flex items-center gap-3 pl-1">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
            AD
          </div>
          <div className="hidden md:block text-left">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
              Admin Comercial
            </p>
            <p className="text-xs text-zinc-500 font-medium mt-0.5">
              Administrador General
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
