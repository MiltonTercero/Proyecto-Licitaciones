'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { UrgentTendersBanner } from '@/components/dashboard/urgent-tenders-banner';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tender } from '@/lib/types/database';
import {
  Send,
  Trophy,
  Clock,
  BadgeDollarSign,
  XCircle,
  FileEdit,
  ArrowRight,
  Building2,
  Calendar,
  DollarSign,
  PlusCircle,
  Loader2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function DashboardPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
    <div className="flex-1 flex flex-col">
      <Navbar onRefresh={handleRefresh} isRefreshing={refreshing} />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header Title */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
              Panel de Control de Licitaciones
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Visión general del estado comercial, fechas límite y gestión de cobranza
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/licitaciones/nueva"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Crear Nueva Licitación</span>
            </Link>
          </div>
        </div>

        {/* Banner de Licitaciones Próximas a Vencer (< 48h) + Disparador Cron */}
        <UrgentTendersBanner tenders={tenders} onCronExecuted={fetchTenders} />

        {/* Grid de KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Licitaciones Activas"
            value={activeCount}
            subtitle={`${draftCount} borradores en preparación`}
            icon={Send}
            color="blue"
          />
          <KpiCard
            title="Licitaciones Ganadas"
            value={wonCount}
            subtitle="Adjudicadas / En entrega"
            icon={Trophy}
            color="emerald"
          />
          <KpiCard
            title="Saldo Por Cobrar"
            value={`$${totalPendingAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`${pendingCollection.length} licitaciones facturadas`}
            icon={Clock}
            color="amber"
          />
          <KpiCard
            title="Recaudado / Cobrado"
            value={`$${totalCollectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            subtitle={`${collectedCount} licitaciones saldadas`}
            icon={BadgeDollarSign}
            color="emerald"
          />
        </div>

        {/* Explicador Visual de Estados (HCI Accessibility) */}
        <div className="p-4 bg-zinc-100/70 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Guía Visual del Ciclo de Licitación
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="borrador" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Crea la propuesta y añade ítems sin exceder presupuesto.</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="activa" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Requiere adjunto. Notifica al cliente por Resend.</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="finalizada" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Ganada y culminada la entrega técnica.</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="por_cobrar" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Facturada. Permite registrar cobros y abonos.</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="cobrada" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Transiciona automático al quedar saldo en $0.00.</p>
            </div>
            <div className="p-2.5 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-700">
              <StatusBadge status="perdida" size="sm" />
              <p className="text-[11px] text-zinc-500 mt-1">Manual o automática si vence la fecha límite.</p>
            </div>
          </div>
        </div>

        {/* Tabla de Licitaciones Recientes */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Todas las Licitaciones Comerciales
              </h2>
              <p className="text-xs text-zinc-500">
                Monitoreo en tiempo real de propuestas y saldos
              </p>
            </div>

            <Link
              href="/licitaciones"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
            >
              <span>Ver Listado Completo con Filtros</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="p-12 text-center text-zinc-400 flex flex-col items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
              <p className="text-xs font-semibold">Cargando licitaciones...</p>
            </div>
          ) : tenders.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                No hay licitaciones registradas aún
              </p>
              <Link
                href="/licitaciones/nueva"
                className="mt-3 inline-block px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Crear Primera Licitación
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Código & Licitación</th>
                    <th className="py-3.5 px-5">Empresa Cliente</th>
                    <th className="py-3.5 px-5">Estado</th>
                    <th className="py-3.5 px-5 text-right">Total Propuesta</th>
                    <th className="py-3.5 px-5">Fecha Límite</th>
                    <th className="py-3.5 px-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {tenders.map((tender) => {
                    const deadline = new Date(tender.fecha_limite);
                    const isPast = deadline < new Date() && tender.status === 'activa';

                    return (
                      <tr
                        key={tender.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-4 px-5">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1.5"
                          >
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-[11px] text-zinc-700 dark:text-zinc-300">
                              {tender.code}
                            </span>
                            <span className="truncate max-w-xs">{tender.title}</span>
                          </Link>
                          {tender.description && (
                            <p className="text-[11px] text-zinc-500 truncate max-w-sm mt-0.5">
                              {tender.description}
                            </p>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{tender.client?.name || 'N/A'}</span>
                          </div>
                          <span className="text-[10px] text-zinc-500">
                            {tender.client?.tax_id}
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          <StatusBadge status={tender.status} size="sm" />
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100">
                            ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-[10px] text-zinc-500">
                            Máx: ${Number(tender.presupuesto_maximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <div className={`flex items-center gap-1 font-medium ${isPast ? 'text-rose-600 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            <Calendar className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {deadline.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-400">
                            {deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-center">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-semibold transition-colors"
                          >
                            <span>Detalles</span>
                            <ArrowRight className="w-3 h-3" />
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
      </main>
    </div>
  );
}
