import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'blue' | 'amber' | 'emerald' | 'purple' | 'rose' | 'slate';
  trend?: string;
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'blue',
  trend,
}: KpiCardProps) {
  const colorStyles = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400 border-blue-100 dark:border-blue-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 border-purple-100 dark:border-purple-900/50',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 truncate">
          {title}
        </span>
        <div className={`p-2 rounded-xl border ${colorStyles[color]} shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div>
        <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-zinc-500 mt-1 flex items-center justify-between">
            <span>{subtitle}</span>
            {trend && <span className="font-semibold text-emerald-600">{trend}</span>}
          </p>
        )}
      </div>
    </div>
  );
}
