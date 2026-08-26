'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Search,
  User,
  Plus,
  Sparkles,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ onRefresh, isRefreshing }: NavbarProps) {
  return (
    <header className="h-16 bg-white dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, cliente o licitación..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl text-xs text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            title="Actualizar datos"
            className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        )}

        <Link
          href="/licitaciones/nueva"
          className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nueva Licitación</span>
        </Link>

        <div className="h-6 w-px bg-zinc-200 dark:bg-zinc-800 mx-1" />

        {/* User profile dropdown badge */}
        <div className="flex items-center gap-2.5 pl-1">
          <div className="w-8 h-8 rounded-full bg-linear-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
            AD
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-none">
              Admin Comercial
            </p>
            <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
              Rol: Administrador
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
