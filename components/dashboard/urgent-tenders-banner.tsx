'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Tender } from '@/lib/types/database';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  X,
} from 'lucide-react';

interface UrgentTendersBannerProps {
  tenders: Tender[];
  onCronExecuted?: () => void;
}

export function UrgentTendersBanner({ tenders }: UrgentTendersBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const now = new Date();

  // Filtramos licitaciones activas que vencen en menos de 48 horas
  const urgentTenders = tenders.filter((t) => {
    if (t.status !== 'activa') return false;
    const deadline = new Date(t.fecha_limite);
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48;
  });

  if (urgentTenders.length === 0 || dismissed) {
    return null;
  }

  const firstUrgent = urgentTenders[0];
  const deadline = new Date(firstUrgent.fecha_limite);
  const diffHours = Math.max(0, Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return (
    <div
      role="alert"
      aria-live="polite"
      className="w-full bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/70 rounded-2xl px-4 py-3 sm:py-2.5 shadow-xs transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200"
    >
      <div className="flex items-center gap-3 overflow-hidden flex-1">
        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-2xs shrink-0">
          <AlertTriangle className="w-5 h-5" aria-hidden="true" />
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs sm:text-sm">
          <span className="font-bold">
            {urgentTenders.length === 1
              ? '1 licitación próxima a vencer:'
              : `${urgentTenders.length} licitaciones próximas a vencer (<48h):`}
          </span>
          <span className="font-semibold text-amber-800 dark:text-amber-300 truncate max-w-xs sm:max-w-md">
            {firstUrgent.code} - {firstUrgent.title}
          </span>
          <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400 bg-rose-100/80 dark:bg-rose-950/80 px-2 py-0.5 rounded-md text-xs shrink-0">
            <Clock className="w-3.5 h-3.5" aria-hidden="true" />
            {diffHours > 0 ? `${diffHours}h restantes` : 'Vence hoy'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <Link
          href={`/licitaciones/${firstUrgent.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-colors shadow-2xs cursor-pointer"
          aria-label={`Gestionar licitación urgente ${firstUrgent.code}`}
        >
          <span>Gestionar</span>
          <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
        </Link>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-amber-700 dark:text-amber-300 hover:bg-amber-200/50 dark:hover:bg-amber-900/50 rounded-xl transition-colors cursor-pointer"
          aria-label="Descartar aviso de licitaciones urgentes"
          title="Descartar aviso"
        >
          <X className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
