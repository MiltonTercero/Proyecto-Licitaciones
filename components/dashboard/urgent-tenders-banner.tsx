'use client';

import React from 'react';
import Link from 'next/link';
import { Tender } from '@/lib/types/database';
import {
  AlertTriangle,
  Clock,
  ArrowRight,
  Building2,
} from 'lucide-react';

interface UrgentTendersBannerProps {
  tenders: Tender[];
  onCronExecuted?: () => void;
}

export function UrgentTendersBanner({
  tenders,
}: UrgentTendersBannerProps) {
  const now = new Date();

  // Filtramos licitaciones activas que vencen en menos de 48 horas
  const urgentTenders = tenders.filter((t) => {
    if (t.status !== 'activa') return false;
    const deadline = new Date(t.fecha_limite);
    const diffHours = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 48;
  });

  if (urgentTenders.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border border-amber-300 dark:border-amber-700/60 rounded-2xl p-5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Licitaciones Próximas a Vencer (&lt; 48 Horas)</span>
              <span className="bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 text-xs px-2 py-0.5 rounded-full font-bold">
                {urgentTenders.length} en riesgo
              </span>
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">
              Estas licitaciones requieren seguimiento urgente antes de la fecha límite establecida.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de licitaciones urgentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {urgentTenders.map((tender) => {
          const deadline = new Date(tender.fecha_limite);
          const diffHours = Math.max(
            0,
            (deadline.getTime() - now.getTime()) / (1000 * 60 * 60)
          );

          return (
            <div
              key={tender.id}
              className="p-3.5 bg-white dark:bg-zinc-900 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between shadow-xs hover:border-amber-400 transition-colors"
            >
              <div className="overflow-hidden pr-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {tender.code} • {tender.title}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span className="flex items-center gap-1 truncate">
                    <Building2 className="w-3 h-3 text-zinc-400" />
                    {tender.client?.name || 'Cliente'}
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400 shrink-0">
                    <Clock className="w-3 h-3" />
                    {diffHours > 0 ? `${diffHours.toFixed(0)}h restantes` : 'Expirada (Vencida)'}
                  </span>
                </div>
              </div>

              <Link
                href={`/licitaciones/${tender.id}`}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-lg shrink-0 transition-colors"
              >
                <span>Gestionar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </div>
  );
}
