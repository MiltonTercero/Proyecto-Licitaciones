'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  History,
  Search,
  Filter,
  User,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  ExternalLink,
} from 'lucide-react';

export default function AuditPage() {
  const [transitions, setTransitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchTransitions = async () => {
    try {
      const res = await fetch('/api/transitions');
      const data = await res.json();
      if (data.success) {
        setTransitions(data.data);
      }
    } catch (err) {
      console.error('Error fetching transitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransitions();
  }, []);

  const filtered = transitions.filter((tr) => {
    const matchesSearch =
      tr.tenderCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tr.tenderTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tr.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tr.notes && tr.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || tr.new_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col">
      <Navbar onRefresh={fetchTransitions} />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
              <History className="w-6 h-6 text-blue-600" />
              <span>Auditoría y Registro de Transiciones</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Trazabilidad inmutable de cambios de estado, operadores y tareas automáticas del sistema
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-xl shadow-xs">
              Total Eventos: <strong>{transitions.length}</strong>
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2 relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código de licitación, operador o nota..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs"
          >
            <option value="all">Todos los estados resultantes</option>
            <option value="borrador">Borrador</option>
            <option value="activa">Activa</option>
            <option value="finalizada">Finalizada</option>
            <option value="por_cobrar">Por Cobrar</option>
            <option value="cobrada">Cobrada</option>
            <option value="perdida">Perdida</option>
          </select>
        </div>

        {/* Audit Timeline List */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold">Cargando eventos de auditoría...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-xs">
              No se encontraron registros de auditoría que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {filtered.map((tr, idx) => {
                const date = new Date(tr.created_at);

                return (
                  <div key={tr.id || idx} className="relative group">
                    <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-blue-600 bg-white dark:bg-zinc-900" />

                    <div className="p-4 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            href={`/licitaciones/${tr.tender_id}`}
                            className="font-bold text-blue-600 hover:underline flex items-center gap-1 text-xs"
                          >
                            <span className="font-mono bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                              {tr.tenderCode}
                            </span>
                            <span>{tr.tenderTitle}</span>
                            <ExternalLink className="w-3 h-3 ml-0.5" />
                          </Link>
                          <span>•</span>
                          {tr.previous_status && tr.previous_status !== 'none' ? (
                            <>
                              <StatusBadge status={tr.previous_status} size="sm" />
                              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
                            </>
                          ) : null}
                          <StatusBadge status={tr.new_status} size="sm" />
                        </div>

                        <div className="flex items-center gap-3 text-xs text-zinc-500">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            <strong className="text-zinc-700 dark:text-zinc-300 font-medium">
                              {tr.user_name}
                            </strong>
                          </span>
                          <span>•</span>
                          <span>
                            {date.toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>

                      {tr.notes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-800/80 p-2.5 rounded-lg border border-zinc-200/80 dark:border-zinc-700/80 leading-relaxed font-mono">
                          {tr.notes}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
