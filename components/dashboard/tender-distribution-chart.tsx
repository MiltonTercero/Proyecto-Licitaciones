'use client';

import React, { useState } from 'react';
import { Tender } from '@/lib/types/database';
import { PieChart, DollarSign, Filter, Layers, CheckCircle2 } from 'lucide-react';

interface TenderDistributionChartProps {
  tenders: Tender[];
  onFilterStatus?: (status: string) => void;
}

export function TenderDistributionChart({
  tenders,
  onFilterStatus,
}: TenderDistributionChartProps) {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  const totalCount = tenders.length || 1;

  const categories = [
    {
      id: 'activa',
      label: 'Activas en Curso',
      color: '#2563eb', // blue-600
      bgClass: 'bg-blue-600',
      borderClass: 'border-blue-200 dark:border-blue-900',
      lightBg: 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300',
      items: tenders.filter((t) => t.status === 'activa'),
    },
    {
      id: 'finalizada',
      label: 'Ganadas / Adjudicadas',
      color: '#059669', // emerald-600
      bgClass: 'bg-emerald-600',
      borderClass: 'border-emerald-200 dark:border-emerald-900',
      lightBg: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300',
      items: tenders.filter((t) => t.status === 'finalizada'),
    },
    {
      id: 'por_cobrar',
      label: 'En Cobranza / Facturadas',
      color: '#d97706', // amber-600
      bgClass: 'bg-amber-600',
      borderClass: 'border-amber-200 dark:border-amber-900',
      lightBg: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300',
      items: tenders.filter((t) => t.status === 'por_cobrar'),
    },
    {
      id: 'cobrada',
      label: 'Cobradas / Liquidadas',
      color: '#0d9488', // teal-600
      bgClass: 'bg-teal-600',
      borderClass: 'border-teal-200 dark:border-teal-900',
      lightBg: 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300',
      items: tenders.filter((t) => t.status === 'cobrada'),
    },
    {
      id: 'borrador',
      label: 'Borradores en Preparación',
      color: '#64748b', // slate-500
      bgClass: 'bg-slate-500',
      borderClass: 'border-slate-200 dark:border-slate-800',
      lightBg: 'bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300',
      items: tenders.filter((t) => t.status === 'borrador'),
    },
    {
      id: 'perdida',
      label: 'Perdidas / Desestimadas',
      color: '#e11d48', // rose-600
      bgClass: 'bg-rose-600',
      borderClass: 'border-rose-200 dark:border-rose-900',
      lightBg: 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300',
      items: tenders.filter((t) => t.status === 'perdida'),
    },
  ];

  // Métricas totales
  const totalAmount = tenders.reduce((acc, t) => acc + Number(t.total_estimado || 0), 0);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs space-y-6">
      {/* Header del Gráfico */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 shadow-2xs">
            <PieChart className="w-5 h-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Distribución y Flujo del Portafolio Comercial</span>
              <span className="text-xs text-slate-500 font-normal">
                ({tenders.length} licitaciones registradas)
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
              Proporción porcentual por fases operativas y volumen financiero cotizado
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-semibold text-slate-600 dark:text-zinc-400">
          <span className="bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl">
            Volumen Total: <strong className="text-slate-900 dark:text-zinc-100 font-bold">${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
          </span>
        </div>
      </div>

      {/* Barra de Distribución Proporcional Segmentada Interactiva */}
      <div className="space-y-2">
        <div
          className="w-full h-5 rounded-xl overflow-hidden flex bg-slate-100 dark:bg-zinc-800 p-0.5 shadow-inner"
          role="progressbar"
          aria-label="Distribución porcentual de licitaciones"
        >
          {categories.map((cat) => {
            const count = cat.items.length;
            const percentage = (count / totalCount) * 100;
            if (percentage === 0) return null;

            const isHovered = hoveredSegment === cat.id;

            return (
              <div
                key={cat.id}
                onMouseEnter={() => setHoveredSegment(cat.id)}
                onMouseLeave={() => setHoveredSegment(null)}
                onClick={() => onFilterStatus && onFilterStatus(cat.id)}
                style={{ width: `${percentage}%`, backgroundColor: cat.color }}
                className={`h-full first:rounded-l-lg last:rounded-r-lg transition-all duration-200 cursor-pointer ${
                  isHovered ? 'scale-y-125 opacity-100 shadow-md z-10' : 'opacity-90 hover:opacity-100'
                }`}
                title={`${cat.label}: ${count} licitaciones (${percentage.toFixed(1)}%)`}
              />
            );
          })}
        </div>
      </div>

      {/* Leyenda Interactiva en Cuadrícula de Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {categories.map((cat) => {
          const count = cat.items.length;
          const percentage = ((count / totalCount) * 100).toFixed(1);
          const catAmount = cat.items.reduce((acc, t) => acc + Number(t.total_estimado || 0), 0);
          const isHovered = hoveredSegment === cat.id;

          return (
            <div
              key={cat.id}
              onMouseEnter={() => setHoveredSegment(cat.id)}
              onMouseLeave={() => setHoveredSegment(null)}
              onClick={() => onFilterStatus && onFilterStatus(cat.id)}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                isHovered
                  ? 'bg-slate-50 dark:bg-zinc-800/80 border-slate-300 dark:border-zinc-700 shadow-sm scale-102'
                  : 'bg-slate-50/50 dark:bg-zinc-800/30 border-slate-200/60 dark:border-zinc-800/60 hover:bg-slate-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span
                  className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: cat.color }}
                  aria-hidden="true"
                />
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 truncate">
                  {cat.label.split(' ')[0]}
                </span>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <span className="text-lg font-black text-slate-900 dark:text-zinc-100">
                  {count}
                </span>
                <span className="text-[11px] font-bold text-slate-500 dark:text-zinc-400">
                  {percentage}%
                </span>
              </div>

              <div className="text-[10px] text-slate-400 truncate mt-1">
                ${catAmount.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
