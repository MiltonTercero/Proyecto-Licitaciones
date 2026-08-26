'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Receipt,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
} from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenderId: string;
  tenderCode: string;
  totalEstimado: number;
  totalPagado: number;
  saldoPendiente: number;
  onPaymentSuccess: (result: any) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  tenderId,
  tenderCode,
  totalEstimado,
  totalPagado,
  saldoPendiente,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [amount, setAmount] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const numAmount = parseFloat(amount) || 0;
  const newPendingBalance = Math.max(0, saldoPendiente - numAmount);
  const willBeFullyPaid = numAmount > 0 && Math.abs(saldoPendiente - numAmount) < 0.01;
  const isOverPending = numAmount > saldoPendiente + 0.01;

  const handlePayFull = () => {
    setAmount(saldoPendiente.toFixed(2));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numAmount <= 0) {
      setError('Por favor ingrese un monto mayor a cero');
      return;
    }

    if (isOverPending) {
      setError(`El monto ingresado ($${numAmount.toFixed(2)}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)})`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/tenders/${tenderId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          reference: reference.trim() || 'Abono registrado',
          userName: 'Administrador Financiero',
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al registrar el pago');
      }

      onPaymentSuccess(data);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar el pago');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Registrar Pago de Licitación
              </h3>
              <p className="text-xs text-zinc-500 font-medium">{tenderCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Breakdown Cards */}
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-3 gap-2 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 text-center">
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Total Facturado</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                ${totalEstimado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Total Pagado</span>
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                ${totalPagado.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <div>
              <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Saldo Pendiente</span>
              <p className="text-sm font-bold text-amber-600 dark:text-amber-400">
                ${saldoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  Monto del Pago (USD) *
                </label>
                <button
                  type="button"
                  onClick={handlePayFull}
                  className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Saldar Total (${saldoPendiente.toFixed(2)})</span>
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={saldoPendiente}
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => {
                    setAmount(e.target.value);
                    setError(null);
                  }}
                  className={`w-full pl-9 pr-4 py-2.5 bg-white dark:bg-zinc-800 border rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 ${
                    isOverPending
                      ? 'border-red-400 focus:ring-red-400 text-red-700'
                      : 'border-zinc-300 dark:border-zinc-700 focus:ring-blue-500'
                  }`}
                  required
                />
              </div>

              {/* Dynamic Feedback Helper */}
              {numAmount > 0 && !isOverPending && (
                <div className="mt-2 p-2.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 rounded-lg text-xs flex items-center justify-between">
                  <span className="text-blue-800 dark:text-blue-200">
                    Saldo restante posterior: <strong>${newPendingBalance.toFixed(2)}</strong>
                  </span>
                  {willBeFullyPaid && (
                    <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>¡Pasará a Cobrada automáticamente!</span>
                    </span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                Referencia de Pago o Comprobante
              </label>
              <input
                type="text"
                placeholder="Ej. Transferencia BCP #92831, Cheque 4410, etc."
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading || isOverPending || numAmount <= 0}
                className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Registrando...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Confirmar Pago</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
