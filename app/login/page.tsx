'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/auth-context';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Loader2,
  AlertCircle,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [touchedEmail, setTouchedEmail] = useState(false);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (user) {
      router.push('/');
    }
  }, [user, router]);

  // Validación de Email en tiempo real
  const isEmailValid = email.includes('@') && email.trim().length >= 5;
  const isEmailDirtyAndInvalid = touchedEmail && !isEmailValid && email.length > 0;
  const canSubmit = isEmailValid && password.length >= 1 && !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validación estricta en cliente antes de enviar al servidor
    if (!email.includes('@')) {
      setErrorMessage('El correo electrónico debe contener un símbolo "@" válido.');
      return;
    }

    if (!password) {
      setErrorMessage('Por favor ingrese su contraseña.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(email.trim(), password);

      if (!res.success) {
        setErrorMessage(res.message || 'Usuario o contraseña incorrectos.');
      } else {
        router.push('/');
      }
    } catch (err: any) {
      setErrorMessage('Ocurrió un error inesperado al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setTouchedEmail(true);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 sm:p-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-md space-y-6">
        {/* Logo & Encabezado */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/30 mb-2">
            <Briefcase className="w-8 h-8" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
            Sistema de Licitaciones
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500">
            Acceso seguro con autenticación JWT y control de roles (RBAC)
          </p>
        </div>

        {/* Tarjeta de Formulario de Login */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-8 shadow-xl shadow-zinc-200/50 dark:shadow-none space-y-5">
          {/* Mensaje de Error Genérico */}
          {errorMessage && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 rounded-2xl flex items-start gap-3 text-rose-700 dark:text-rose-300 text-xs sm:text-sm animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600" />
              <div>
                <p className="font-bold">Error de autenticación</p>
                <p className="text-xs mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Campo: Correo Electrónico */}
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="email"
                  type="email"
                  placeholder="admin@csc.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!touchedEmail) setTouchedEmail(true);
                  }}
                  onBlur={() => setTouchedEmail(true)}
                  required
                  className={`w-full h-12 pl-11 pr-4 bg-zinc-50 dark:bg-zinc-800 border rounded-2xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 transition-all ${
                    isEmailDirtyAndInvalid
                      ? 'border-rose-500 focus:ring-rose-500 bg-rose-50/20'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'
                  }`}
                />
              </div>
              {/* Error en cliente si falta @ */}
              {isEmailDirtyAndInvalid && (
                <p className="text-xs text-rose-600 dark:text-rose-400 font-medium flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>El correo debe contener un '@' y un dominio válido.</span>
                </p>
              )}
            </div>

            {/* Campo: Contraseña con Toggle Mostrar/Ocultar */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-12 pl-11 pr-12 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-2xl text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 cursor-pointer"
                  title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4.5 h-4.5" />
                  ) : (
                    <Eye className="w-4.5 h-4.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Botón de Envío con Estado de Carga */}
            <button
              type="submit"
              disabled={!canSubmit}
              className={`w-full h-12 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
                canSubmit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/25 hover:shadow-blue-600/35'
                  : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-600 cursor-not-allowed shadow-none'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Validando credenciales...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-5 h-5" />
                  <span>Iniciar Sesión</span>
                </>
              )}
            </button>
          </form>

          {/* Cuentas de Demostración para Prueba Rápida */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider text-center">
              Cuentas de demostración (Click para autocompletar)
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@csc.com', 'Admin123!')}
                className="p-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 rounded-xl text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-blue-700 dark:text-blue-300">
                  Admin
                </span>
                <span className="block text-[9px] text-zinc-500">Admin123!</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('gestor@csc.com', 'Gestor123!')}
                className="p-2 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                  Gestor
                </span>
                <span className="block text-[9px] text-zinc-500">Gestor123!</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickFill('visualizador@csc.com', 'Visual123!')}
                className="p-2 bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-xl text-center transition-colors cursor-pointer"
              >
                <span className="block text-[11px] font-bold text-purple-700 dark:text-purple-300">
                  Visualizador
                </span>
                <span className="block text-[9px] text-zinc-500">Visual123!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
