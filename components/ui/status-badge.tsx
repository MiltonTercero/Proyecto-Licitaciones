import React from 'react';
import { TenderStatus } from '@/lib/types/database';
import {
  FileEdit,
  Send,
  CheckCircle2,
  Clock,
  BadgeDollarSign,
  XCircle,
} from 'lucide-react';

interface StatusBadgeProps {
  status: TenderStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ElementType;
    description: string;
  }
> = {
  borrador: {
    label: 'Borrador',
    bg: 'bg-slate-100 dark:bg-slate-800/60',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: FileEdit,
    description: 'En preparación. Aún no enviada al cliente.',
  },
  activa: {
    label: 'Activa / Enviada',
    bg: 'bg-blue-50 dark:bg-blue-950/50',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-200 dark:border-blue-800',
    icon: Send,
    description: 'Propuesta enviada formalmente al cliente. Esperando resolución.',
  },
  finalizada: {
    label: 'Ganada / Finalizada',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
    description: 'Adjudicada a nuestra empresa. Entrega completada.',
  },
  por_cobrar: {
    label: 'Por Cobrar',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
    icon: Clock,
    description: 'Facturada. Pendiente de recepción de pagos.',
  },
  cobrada: {
    label: 'Cobrada / Liquidada',
    bg: 'bg-green-100 dark:bg-green-950/70',
    text: 'text-green-800 dark:text-green-200',
    border: 'border-green-300 dark:border-green-800',
    icon: BadgeDollarSign,
    description: '100% cobrada. Saldo pendiente $0.00.',
  },
  perdida: {
    label: 'Perdida / Vencida',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    text: 'text-rose-700 dark:text-rose-300',
    border: 'border-rose-200 dark:border-rose-800',
    icon: XCircle,
    description: 'No adjudicada o vencida por fecha límite.',
  },
};

export function StatusBadge({
  status,
  size = 'md',
  showIcon = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: FileEdit,
    description: '',
  };

  const IconComponent = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs font-medium px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3.5 py-1.5 gap-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${config.text} ${config.border} ${sizeClasses[size]} transition-all shadow-xs`}
      title={config.description}
    >
      {showIcon && <IconComponent className={`${iconSizes[size]} shrink-0`} />}
      <span>{config.label}</span>
    </span>
  );
}
