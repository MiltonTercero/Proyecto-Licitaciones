'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSidebar } from './sidebar-context';
import { useTheme } from './theme-context';
import { useAuth } from '@/components/auth/auth-context';
import {
  Menu,
  Search,
  RefreshCw,
  LogOut,
  Settings,
  ChevronDown,
  Sun,
  Moon,
  X,
  User as UserIcon,
  Shield,
} from 'lucide-react';

interface NavbarProps {
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function Navbar({ onRefresh, isRefreshing }: NavbarProps) {
  const { toggleSidebar } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú de perfil al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    }
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileMenu]);

  const handleOpenPreferences = () => {
    setShowProfileMenu(false);
    setShowPreferences(true);
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
  };

  // Iniciales del usuario
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'AD';

  const roleLabel =
    user?.role === 'admin'
      ? 'Administrador General'
      : user?.role === 'gestor'
      ? 'Gestor de Proyectos'
      : user?.role === 'visualizador'
      ? 'Visualizador (Solo Lectura)'
      : 'Administrador General';

  const roleBadgeColor =
    user?.role === 'admin'
      ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 border-blue-200'
      : user?.role === 'gestor'
      ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200'
      : 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-200 border-purple-200';

  return (
    <>
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

          {/* Barra de búsqueda */}
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

          {/* ========================================= */}
          {/* Botón de Perfil Interactivo con Dropdown  */}
          {/* ========================================= */}
          <div className="relative" ref={profileMenuRef}>
            <button
              onClick={() => setShowProfileMenu((prev) => !prev)}
              className="flex items-center gap-3 pl-1 pr-2 py-1.5 rounded-2xl hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-all cursor-pointer group"
              aria-label="Menú de perfil"
            >
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                {initials}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                  {user?.fullName || 'Admin Comercial'}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md border ${roleBadgeColor}`}>
                    {user?.role ? user.role.toUpperCase() : 'ADMIN'}
                  </span>
                </div>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${
                  showProfileMenu ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Dropdown del perfil */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-60 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                {/* Encabezado del menú */}
                <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40">
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    {user?.fullName || 'Admin Comercial'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-0.5 truncate">
                    {user?.email || 'admin@csc.com'}
                  </p>
                  <span className={`inline-block text-[10px] font-bold px-2 py-0.5 mt-2 rounded-md border ${roleBadgeColor}`}>
                    Rol: {roleLabel}
                  </span>
                </div>

                {/* Opciones del menú */}
                <div className="py-1.5">
                  <button
                    onClick={handleOpenPreferences}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                  >
                    <Settings className="w-4.5 h-4.5 text-zinc-400" />
                    <span>Preferencias</span>
                  </button>

                  <div className="mx-3 border-t border-zinc-200 dark:border-zinc-800" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ============================================= */}
      {/* Modal de Preferencias (centrado en pantalla)  */}
      {/* ============================================= */}
      {showPreferences && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            {/* Header del modal */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <Settings className="w-5 h-5 text-zinc-600 dark:text-zinc-400" />
                </div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Preferencias
                </h3>
              </div>
              <button
                onClick={() => setShowPreferences(false)}
                className="p-2 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido del modal */}
            <div className="px-6 py-5 space-y-5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  Apariencia
                </h4>

                <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white dark:bg-zinc-700 rounded-xl border border-zinc-200 dark:border-zinc-600 shadow-2xs">
                      {theme === 'dark' ? (
                        <Moon className="w-5 h-5 text-indigo-500" />
                      ) : (
                        <Sun className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                        Tema de la interfaz
                      </p>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {theme === 'dark' ? 'Modo oscuro activo' : 'Modo claro activo'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    onClick={toggleTheme}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 cursor-pointer focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 ${
                      theme === 'dark' ? 'bg-indigo-600' : 'bg-zinc-300'
                    }`}
                    role="switch"
                    aria-checked={theme === 'dark'}
                    aria-label="Alternar tema oscuro"
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow-sm transition-transform duration-300 ${
                        theme === 'dark' ? 'translate-x-8' : 'translate-x-1'
                      }`}
                    >
                      {theme === 'dark' ? (
                        <Moon className="w-3 h-3 text-indigo-600" />
                      ) : (
                        <Sun className="w-3 h-3 text-amber-500" />
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer del modal */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex justify-end">
              <button
                onClick={() => setShowPreferences(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm"
              >
                Listo
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
