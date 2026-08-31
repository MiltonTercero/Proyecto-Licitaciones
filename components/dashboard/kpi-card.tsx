import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate';
  trend?: {
    value: string;
    positive?: boolean;
    neutral?: boolean;
    period?: string;
  };
  sparklineData?: number[];
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
  sparklineData = [12, 18, 15, 24, 20, 28, 35],
}: KpiCardProps) {
  const colorStyles = {
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
      stroke: '#2563eb',
      fill: 'rgba(37, 99, 235, 0.1)',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
      stroke: '#d97706',
      fill: 'rgba(217, 119, 6, 0.1)',
    },
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
      stroke: '#059669',
      fill: 'rgba(5, 150, 105, 0.1)',
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
      stroke: '#7c3aed',
      fill: 'rgba(124, 58, 237, 0.1)',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
      stroke: '#e11d48',
      fill: 'rgba(225, 29, 72, 0.1)',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
      stroke: '#64748b',
      fill: 'rgba(100, 116, 139, 0.1)',
    },
  };

  const selectedTheme = colorStyles[color] || colorStyles.blue;

  // Generar SVG Sparkline Path
  const minVal = Math.min(...sparklineData);
  const maxVal = Math.max(...sparklineData);
  const range = maxVal - minVal || 1;
  const width = 120;
  const height = 32;

  const points = sparklineData.map((val, idx) => {
    const x = (idx / (sparklineData.length - 1)) * width;
    const y = height - ((val - minVal) / range) * (height - 8) - 4;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const pathD = `M ${points.join(' L ')}`;
  const areaD = `M 0,${height} L ${points.join(' L ')} L ${width},${height} Z`;

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl p-6 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between min-h-[175px] group">
      {/* Top: Título a la izquierda e Icono a la derecha */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 truncate">
          {title}
        </span>
        <div className={`p-2.5 rounded-2xl border ${selectedTheme.iconBg} shrink-0 shadow-2xs group-hover:scale-105 transition-transform`}>
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      </div>

      {/* Centro: Número principal y Sparkline */}
      <div className="flex items-end justify-between gap-2 my-1">
        <div className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-zinc-100 tracking-tight leading-none">
          {value}
        </div>

        {/* Micro-gráfico Sparkline (7 días) */}
        <div className="w-24 sm:w-28 h-8 shrink-0 overflow-hidden" aria-hidden="true">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
            <path d={areaD} fill={selectedTheme.fill} />
            <path
              d={pathD}
              fill="none"
              stroke={selectedTheme.stroke}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>

      {/* Bottom: Tendencia (Delta) y Subtítulo */}
      <div className="pt-2 border-t border-slate-100 dark:border-zinc-800/80 flex items-center justify-between gap-2 text-xs">
        {subtitle && (
          <span className="text-slate-500 dark:text-zinc-400 truncate font-medium">
            {subtitle}
          </span>
        )}

        {trend && (
          <div
            className={`inline-flex items-center gap-1 font-bold text-[11px] px-2 py-0.5 rounded-md shrink-0 ${
              trend.neutral
                ? 'bg-slate-100 text-slate-600 dark:bg-zinc-800 dark:text-zinc-300'
                : trend.positive
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            }`}
          >
            {trend.neutral ? (
              <Minus className="w-3 h-3" aria-hidden="true" />
            ) : trend.positive ? (
              <TrendingUp className="w-3 h-3" aria-hidden="true" />
            ) : (
              <TrendingDown className="w-3 h-3" aria-hidden="true" />
            )}
            <span>{trend.value}</span>
          </div>
        )}
      </div>
    </div>
  );
}
