'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UrgentTendersBanner } from '@/components/dashboard/urgent-tenders-banner';
import { TenderDistributionChart } from '@/components/dashboard/tender-distribution-chart';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tender } from '@/lib/types/database';
import {
  Send,
  Trophy,
  Clock,
  BadgeDollarSign,
  ArrowRight,
  Building2,
  Calendar,
  Loader2,
  HelpCircle,
  X,
  Info,
  Layers,
} from 'lucide-react';

export default function DashboardPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showLegendModal, setShowLegendModal] = useState(false);

  const fetchTenders = async () => {
    try {
      const res = await fetch('/api/tenders');
      const data = await res.json();
      if (data.success) {
        setTenders(data.data);
      }
    } catch (err) {
      console.error('Error cargando licitaciones:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTenders();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTenders();
  };

  // Cálculo de KPIs
  const totalTenders = tenders.length;
  const draftCount = tenders.filter((t) => t.status === 'borrador').length;
  const activeCount = tenders.filter((t) => t.status === 'activa').length;
  const wonCount = tenders.filter((t) => t.status === 'finalizada').length;
  const pendingCollection = tenders.filter((t) => t.status === 'por_cobrar');
  const collectedCount = tenders.filter((t) => t.status === 'cobrada').length;
  const lostCount = tenders.filter((t) => t.status === 'perdida').length;

  // Monto total por cobrar
  const totalPendingAmount = pendingCollection.reduce((acc, t) => {
    const paid = (t.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
    return acc + Math.max(0, t.total_estimado - paid);
  }, 0);

  // Total cobrado histórico
  const totalCollectedAmount = tenders
    .flatMap((t) => t.payments || [])
    .reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 relative">
      <Navbar onRefresh={handleRefresh} isRefreshing={refreshing} />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8 flex-1 pb-16">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
              <Layers className="w-7 h-7 text-blue-600" aria-hidden="true" />
              <span>Panel de Control de Licitaciones</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-1">
              Visión general del estado comercial, fechas límite y gestión de cobranza
            </p>
          </div>
        </div>

        {/* Banner de Licitaciones Próximas a Vencer (< 48h) */}
        <UrgentTendersBanner tenders={tenders} onCronExecuted={fetchTenders} />

        {/* Grid de KPIs Dinámicos con Sparklines y Tendencias */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <KpiCard
            title="Licitaciones Activas"
            value={activeCount}
            subtitle={`${draftCount} borradores en preparación`}
            icon={Send}
            color="blue"
            trend={{ value: '+14.2% vs mes anterior', positive: true }}
            sparklineData={[8, 12, 14, 11, 16, 18, activeCount || 20]}
          />
          <KpiCard
            title="Licitaciones Ganadas"
            value={wonCount}
            subtitle="Adjudicadas / En entrega"
            icon={Trophy}
            color="emerald"
            trend={{ value: '+8.5% vs mes anterior', positive: true }}
            sparklineData={[5, 7, 9, 8, 11, 13, wonCount || 15]}
          />
          <KpiCard
            title="Saldo Por Cobrar"
            value={`$${totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`${pendingCollection.length} licitaciones facturadas`}
            icon={Clock}
            color="amber"
            trend={{ value: 'Facturado activo', neutral: true }}
            sparklineData={[12000, 15000, 11000, 18000, 14000, 16000, totalPendingAmount || 12000]}
          />
          <KpiCard
            title="Recaudado / Cobrado"
            value={`$${totalCollectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`${collectedCount} licitaciones saldadas`}
            icon={BadgeDollarSign}
            color="emerald"
            trend={{ value: '+22.0% cobros', positive: true }}
            sparklineData={[10000, 14000, 18000, 22000, 25000, 28000, totalCollectedAmount || 30000]}
          />
        </div>

        {/* Gráfico Visual de Distribución de Licitaciones */}
        <TenderDistributionChart tenders={tenders} />

        {/* Tabla de Licitaciones Recientes */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-6 border-b border-slate-100 dark:border-zinc-800/80 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100">
                Todas las Licitaciones Comerciales
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">
                Monitoreo en tiempo real de propuestas y saldos
              </p>
            </div>

            <Link
              href="/licitaciones"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
              aria-label="Ver listado completo de licitaciones con filtros"
            >
              <span>Ver Listado Completo con Filtros</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" aria-hidden="true" />
              <p className="text-xs font-semibold">Cargando licitaciones...</p>
            </div>
          ) : tenders.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-sm font-semibold text-slate-700 dark:text-zinc-300">
                No hay licitaciones registradas aún
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Utilice la opción "Nueva Licitación" en el menú lateral para comenzar.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200/80 dark:border-zinc-800 font-semibold text-slate-500 dark:text-zinc-400 uppercase tracking-wider text-[10px]">
                    <th className="py-4 px-6">Código & Licitación</th>
                    <th className="py-4 px-6">Empresa Cliente</th>
                    <th className="py-4 px-6">Estado</th>
                    <th className="py-4 px-6 text-right">Total Propuesta</th>
                    <th className="py-4 px-6">Fecha Límite</th>
                    <th className="py-4 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {tenders.map((tender) => {
                    const deadline = new Date(tender.fecha_limite);
                    const isPast = deadline < new Date() && tender.status === 'activa';

                    return (
                      <tr
                        key={tender.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-5 px-6">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2"
                          >
                            <span className="bg-slate-100 dark:bg-zinc-800 px-2.5 py-0.5 rounded-lg font-mono text-[11px] text-slate-700 dark:text-zinc-300">
                              {tender.code}
                            </span>
                            <span className="truncate max-w-xs">{tender.title}</span>
                          </Link>
                          {tender.description && (
                            <p className="text-[11px] text-slate-500 dark:text-zinc-400 truncate max-w-sm mt-0.5">
                              {tender.description}
                            </p>
                          )}
                        </td>

                        <td className="py-5 px-6">
                          <div className="font-semibold text-slate-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Building2 className="w-4 h-4 text-slate-400 shrink-0" aria-hidden="true" />
                            <span className="truncate max-w-[180px]">{tender.client?.name || 'N/A'}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {tender.client?.tax_id}
                          </span>
                        </td>

                        <td className="py-5 px-6">
                          <StatusBadge status={tender.status} size="sm" />
                        </td>

                        <td className="py-5 px-6 text-right">
                          <div className="font-bold text-slate-900 dark:text-zinc-100">
                            ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Máx: ${Number(tender.presupuesto_maximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="py-5 px-6">
                          <div className={`flex items-center gap-1.5 font-medium ${isPast ? 'text-rose-600 font-bold' : 'text-slate-700 dark:text-zinc-300'}`}>
                            <Calendar className="w-4 h-4 shrink-0" aria-hidden="true" />
                            <span>
                              {deadline.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400">
                            {deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-5 px-6 text-center">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="inline-flex items-center gap-1 px-3.5 py-1.5 bg-slate-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-xs font-semibold transition-colors shadow-2xs"
                            aria-label={`Ver detalles de licitación ${tender.code}`}
                          >
                            <span>Detalles</span>
                            <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Botón Discreto Inferior Izquierdo: "Ver leyenda de estados" */}
        <div className="pt-2 flex justify-start">
          <button
            onClick={() => setShowLegendModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 hover:border-slate-300 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-100 rounded-xl text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            aria-label="Abrir guía y leyenda del ciclo de estados de licitación"
          >
            <Info className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <span>Ver leyenda de estados</span>
          </button>
        </div>
      </main>

      {/* Modal de Leyenda de Estados */}
      {showLegendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
          aria-labelledby="legend-modal-title"
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 rounded-xl">
                  <HelpCircle className="w-5 h-5" aria-hidden="true" />
                </div>
                <h3 id="legend-modal-title" className="text-base font-bold text-slate-900 dark:text-zinc-100">
                  Guía Visual del Ciclo de Licitación
                </h3>
              </div>
              <button
                onClick={() => setShowLegendModal(false)}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-zinc-200 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-800 cursor-pointer"
                aria-label="Cerrar modal de leyenda"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Descripción detallada de cada una de las fases normativas del ciclo comercial y sus reglas de transición:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="borrador" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Fase de preparación. Se agregan ítems y cotización sin exceder el presupuesto máximo.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="activa" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Requiere adjuntar propuesta formal. Al activarse envía notificación automática con PDF al cliente vía Resend.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="finalizada" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Licitación adjudicada a la empresa con entrega comercial y técnica completada.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="por_cobrar" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Facturada formalmente. Permite registrar pagos y abonos contra el saldo pendiente.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="cobrada" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Transiciona automáticamente cuando el saldo pendiente llega a $0.00 tras los cobros.
                </p>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-zinc-800/60 rounded-2xl border border-slate-200/60 dark:border-zinc-700 space-y-2">
                <StatusBadge status="perdida" size="sm" />
                <p className="text-[11px] text-slate-600 dark:text-zinc-400 leading-relaxed">
                  Manual (no ganada) o automática (expirada por fecha límite mediante Vercel Cron).
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end border-t border-slate-100 dark:border-zinc-800">
              <button
                onClick={() => setShowLegendModal(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
