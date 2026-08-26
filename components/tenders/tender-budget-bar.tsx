'use client';

import React from 'react';
import { DollarSign, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TenderBudgetBarProps {
  currentTotal: number;
  maxBudget: number;
  showDetails?: boolean;
}

export function TenderBudgetBar({
  currentTotal,
  maxBudget,
  showDetails = true,
}: TenderBudgetBarProps) {
  const total = Number(currentTotal) || 0;
  const max = Number(maxBudget) || 1;
  const percentage = Math.min(100, Math.round((total / max) * 100));
  const remaining = max - total;
  const isOverBudget = total > max;
  const isCloseToLimit = percentage >= 85 && percentage <= 100;

  let barColor = 'bg-blue-600';
  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-200';

  if (isOverBudget) {
    barColor = 'bg-red-600';
    badgeColor = 'bg-red-50 text-red-700 border-red-200';
  } else if (percentage === 100) {
    barColor = 'bg-emerald-600';
    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
  } else if (isCloseToLimit) {
    barColor = 'bg-amber-500';
    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
  }

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-300">
            <DollarSign className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Control de Presupuesto
            </h4>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                ${total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              <span className="text-xs text-zinc-500">
                de ${max.toLocaleString('en-US', { minimumFractionDigits: 2 })} máx.
              </span>
            </div>
          </div>
        </div>

        <div className={`px-2.5 py-1 rounded-full border text-xs font-semibold flex items-center gap-1 ${badgeColor}`}>
          {isOverBudget ? (
            <>
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Excedido ({percentage}%)</span>
            </>
          ) : percentage === 100 ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>100% Asignado</span>
            </>
          ) : (
            <span>{percentage}% Utilizado</span>
          )}
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 rounded-full ${barColor}`}
          style={{ width: `${Math.min(100, (total / max) * 100)}%` }}
        />
      </div>

      {showDetails && (
        <div className="flex justify-between items-center mt-2 text-xs text-zinc-500">
          <span>
            {remaining >= 0 ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Disponible: ${remaining.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-red-600 font-medium">
                Sobrepasado por: ${Math.abs(remaining).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            )}
          </span>
          <span>Regla HCI: No superar presupuesto</span>
        </div>
      )}
    </div>
  );
}
