'use client';

import React from 'react';
import { TenderStatus } from '@/lib/types/database';
import {
  FileEdit,
  Send,
  Trophy,
  Receipt,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';

interface StatusStepperProps {
  currentStatus: TenderStatus;
  hasProposalFile?: boolean;
}

export function StatusStepper({ currentStatus, hasProposalFile }: StatusStepperProps) {
  const steps = [
    {
      id: 'borrador',
      label: '1. Redacción Borrador',
      shortLabel: 'Borrador',
      description: hasProposalFile ? 'Propuesta adjunta lista' : 'Falta adjuntar propuesta',
      icon: FileEdit,
    },
    {
      id: 'activa',
      label: '2. Enviada / Activa',
      shortLabel: 'Activa',
      description: 'Notificación enviada al cliente',
      icon: Send,
    },
    {
      id: 'finalizada',
      label: '3. Ganada / Entregada',
      shortLabel: 'Finalizada',
      description: 'Licitación adjudicada con éxito',
      icon: Trophy,
    },
    {
      id: 'por_cobrar',
      label: '4. Facturada / Cobro',
      shortLabel: 'Por Cobrar',
      description: 'Registro de abonos y pagos',
      icon: Receipt,
    },
    {
      id: 'cobrada',
      label: '5. Cobrada / Liquidada',
      shortLabel: 'Cobrada',
      description: '100% cobrada sin saldo pendiente',
      icon: CheckCircle2,
    },
  ];

  const getStepIndex = (status: TenderStatus) => {
    switch (status) {
      case 'borrador':
        return 0;
      case 'activa':
        return 1;
      case 'finalizada':
        return 2;
      case 'por_cobrar':
        return 3;
      case 'cobrada':
        return 4;
      case 'perdida':
        return -1;
      default:
        return 0;
    }
  };

  const currentIndex = getStepIndex(currentStatus);
  const isLost = currentStatus === 'perdida';

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <span>Flujo del Ciclo de Vida</span>
            <span className="text-xs font-normal text-zinc-500">
              (Interacción Guiada)
            </span>
          </h3>
          <p className="text-xs text-zinc-500 mt-0.5">
            Siga la secuencia de estados normativos del proceso comercial
          </p>
        </div>

        {isLost && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 border border-rose-200 text-rose-700 rounded-full text-xs font-semibold">
            <XCircle className="w-3.5 h-3.5" />
            <span>Proceso Cerrado: No Adjudicada / Perdida</span>
          </div>
        )}
      </div>

      {/* Stepper horizontal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isCompleted = !isLost && currentIndex > idx;
          const isCurrent = !isLost && currentIndex === idx;
          const isPending = !isLost && currentIndex < idx;

          let statusBg = 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400';
          let iconBg = 'bg-zinc-200 dark:bg-zinc-700 text-zinc-500';

          if (isCompleted) {
            statusBg = 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200';
            iconBg = 'bg-emerald-600 text-white';
          } else if (isCurrent) {
            statusBg = 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-900 dark:text-blue-100 ring-2 ring-blue-500/20';
            iconBg = 'bg-blue-600 text-white animate-pulse';
          } else if (isLost) {
            statusBg = 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 opacity-60 text-zinc-400';
            iconBg = 'bg-zinc-300 dark:bg-zinc-700 text-zinc-400';
          }

          return (
            <div
              key={step.id}
              className={`flex flex-col p-3 rounded-lg border transition-all ${statusBg} relative`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center font-semibold text-xs shrink-0 ${iconBg}`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-3.5 h-3.5" />}
                </div>
                <span className="font-semibold text-xs truncate">
                  {step.shortLabel}
                </span>
              </div>
              <p className="text-[11px] opacity-80 leading-tight">
                {step.description}
              </p>

              {isCurrent && (
                <div className="mt-2 pt-1 border-t border-blue-200 dark:border-blue-800 flex items-center justify-between text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                  <span>FASE ACTUAL</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
