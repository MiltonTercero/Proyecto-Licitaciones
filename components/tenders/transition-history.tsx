import React from 'react';
import { TenderTransition } from '@/lib/types/database';
import { StatusBadge } from '@/components/ui/status-badge';
import { Clock, User, ShieldCheck, ArrowRight } from 'lucide-react';

interface TransitionHistoryProps {
  transitions?: TenderTransition[];
}

export function TransitionHistory({ transitions = [] }: TransitionHistoryProps) {
  if (!transitions || transitions.length === 0) {
    return (
      <div className="p-8 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
        <Clock className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
        <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          Sin historial de transiciones
        </p>
        <p className="text-xs text-zinc-500 mt-0.5">
          Los cambios de estado se registrarán automáticamente con sello de tiempo y auditoría.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Historial de Transiciones y Auditoría
            </h4>
            <p className="text-xs text-zinc-500">
              Trazabilidad completa de estados, operadores y eventos automáticos
            </p>
          </div>
        </div>
        <span className="text-xs font-semibold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-full">
          {transitions.length} registros
        </span>
      </div>

      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
        {transitions.map((tr, idx) => {
          const date = new Date(tr.created_at);
          const isFirst = idx === 0;

          return (
            <div key={tr.id || idx} className="relative group">
              {/* Dot */}
              <div
                className={`absolute -left-6 top-1 w-3.5 h-3.5 rounded-full border-2 bg-white dark:bg-zinc-900 ${
                  isFirst
                    ? 'border-blue-600 ring-4 ring-blue-500/20'
                    : 'border-zinc-400 dark:border-zinc-600'
                }`}
              />

              <div className="p-3.5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 transition-colors">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
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
                        {tr.user_name || 'Sistema'}
                      </strong>
                    </span>
                    <span>•</span>
                    <span title={date.toLocaleString()}>
                      {date.toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
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
    </div>
  );
}
