'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-context';
import { AuditLog } from '@/lib/types/database';
import {
  History,
  Shield,
  Search,
  Filter,
  ArrowLeft,
  Loader2,
  AlertCircle,
  Eye,
  X,
  FileCode,
  ShieldAlert,
} from 'lucide-react';

export default function AuditAdminPage() {
  const { user: currentUser, authFetch } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [filterAction, setFilterAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [selectedLogForJson, setSelectedLogForJson] = useState<AuditLog | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      let url = '/api/audit?limit=100';
      if (filterAction) url += `&action=${encodeURIComponent(filterAction)}`;
      if (filterUser) url += `&userId=${encodeURIComponent(filterUser)}`;

      const res = await authFetch(url);
      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.message || 'Error al consultar logs de auditoría.');
      } else {
        setLogs(data.data || []);
      }
    } catch (err: any) {
      setError('Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filterAction, filterUser]);

  if (!loading && currentUser && currentUser.role !== 'admin') {
    return (
      <div className="flex-1 flex flex-col min-h-screen">
        <Navbar />
        <main className="p-8 max-w-4xl mx-auto w-full flex-1 flex flex-col items-center justify-center text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">
            Acceso Restringido (403 Forbidden)
          </h1>
          <p className="text-sm text-zinc-500 max-w-md">
            Solo los administradores tienen acceso a la bitácora de auditoría del sistema.
          </p>
          <Link
            href="/"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Volver al Panel Principal
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6 flex-1">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/" className="hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Panel Principal</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Auditoría del Sistema</span>
        </div>

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
              <History className="w-8 h-8 text-blue-600" />
              <span>Bitácora de Auditoría y Cumplimiento</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 mt-1">
              Registro inmutable de acciones críticas, accesos, cambios de datos y trazabilidad
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por acción (ej. CREATE_USER)..."
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
            />
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar por correo de usuario..."
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full h-10 pl-10 pr-4 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs"
            />
          </div>

          <div className="flex items-center justify-end">
            <button
              onClick={() => {
                setFilterAction('');
                setFilterUser('');
              }}
              className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>

        {/* Tabla de Logs */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-sm font-semibold">Cargando registros de auditoría...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center text-zinc-500">
              <History className="w-8 h-8 mx-auto opacity-40 mb-2" />
              <p className="font-bold text-sm">No se encontraron eventos de auditoría</p>
              <p className="text-xs text-zinc-400 mt-1">Los eventos se registrarán automáticamente conforme se ejecuten acciones críticas.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-5">Fecha & Hora (UTC)</th>
                    <th className="py-4 px-5">Acción Realizada</th>
                    <th className="py-4 px-5">Usuario / Email</th>
                    <th className="py-4 px-5">Tabla / Entidad</th>
                    <th className="py-4 px-5">IP Origen</th>
                    <th className="py-4 px-5 text-center">Detalle JSON</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {logs.map((log) => {
                    const isFail = log.action.includes('FAIL') || log.action.includes('BLOCKED');
                    const isDelete = log.action.includes('DELETE');

                    const actionBadge = isFail
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200'
                      : isDelete
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200'
                      : 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border-blue-200';

                    return (
                      <tr
                        key={log.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors font-mono"
                      >
                        <td className="py-4 px-5 text-zinc-500 text-[11px] font-sans">
                          {new Date(log.timestamp).toLocaleString('es-ES', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </td>

                        <td className="py-4 px-5 font-sans">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-bold border ${actionBadge}`}>
                            {log.action}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-zinc-900 dark:text-zinc-100 font-sans">
                          {log.user_email || log.user_id || 'Anónimo / Sistema'}
                        </td>

                        <td className="py-4 px-5 text-zinc-600 dark:text-zinc-400 font-sans">
                          {log.table_name || 'N/A'} {log.record_id ? `(#${log.record_id.slice(0, 8)})` : ''}
                        </td>

                        <td className="py-4 px-5 text-zinc-400 text-[11px]">
                          {log.ip_address || '127.0.0.1'}
                        </td>

                        <td className="py-4 px-5 text-center font-sans">
                          {(log.old_values || log.new_values) ? (
                            <button
                              onClick={() => setSelectedLogForJson(log)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                            >
                              <FileCode className="w-3.5 h-3.5" />
                              <span>Ver Diff</span>
                            </button>
                          ) : (
                            <span className="text-zinc-400 text-[11px]">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Visualizador de JSON Diff */}
      {selectedLogForJson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                  Detalle del Evento: {selectedLogForJson.action}
                </h3>
                <p className="text-xs text-zinc-500">
                  {new Date(selectedLogForJson.timestamp).toISOString()} • Usuario: {selectedLogForJson.user_email || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setSelectedLogForJson(null)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-1">
                  Valores Anteriores (Old Values)
                </p>
                <pre className="p-3 bg-zinc-950 text-amber-400 rounded-xl overflow-x-auto max-h-60 font-mono text-[11px]">
                  {selectedLogForJson.old_values
                    ? JSON.stringify(selectedLogForJson.old_values, null, 2)
                    : 'null (Registro nuevo o evento de acceso)'}
                </pre>
              </div>

              <div>
                <p className="font-bold text-zinc-500 uppercase tracking-wider text-[10px] mb-1">
                  Valores Nuevos (New Values)
                </p>
                <pre className="p-3 bg-zinc-950 text-emerald-400 rounded-xl overflow-x-auto max-h-60 font-mono text-[11px]">
                  {selectedLogForJson.new_values
                    ? JSON.stringify(selectedLogForJson.new_values, null, 2)
                    : 'null'}
                </pre>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLogForJson(null)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
