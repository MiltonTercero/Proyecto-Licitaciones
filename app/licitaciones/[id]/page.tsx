'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/layout/navbar';
import { StatusBadge } from '@/components/ui/status-badge';
import { StatusStepper } from '@/components/tenders/status-stepper';
import { TenderBudgetBar } from '@/components/tenders/tender-budget-bar';
import { FileUploader } from '@/components/tenders/file-uploader';
import { PaymentModal } from '@/components/tenders/payment-modal';
import { TransitionHistory } from '@/components/tenders/transition-history';
import { Tender, Product } from '@/lib/types/database';
import {
  ArrowLeft,
  Building2,
  Calendar,
  DollarSign,
  Send,
  Trophy,
  XCircle,
  Receipt,
  Plus,
  Trash2,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export default function TenderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [tender, setTender] = useState<Tender | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'items' | 'proposal' | 'payments' | 'audit'>('items');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modales
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');

  const fetchTender = async () => {
    try {
      const res = await fetch(`/api/tenders/${id}`);
      const data = await res.json();
      if (data.success) {
        setTender(data.data);
      } else {
        setMessage({ type: 'error', text: data.error || 'Licitación no encontrada' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      }
    } catch (err) {
      console.error('Error fetching products:', err);
    }
  };

  useEffect(() => {
    fetchTender();
    fetchProducts();
  }, [id]);

  // Transición: Enviar licitación formal a activa (Dispara Resend + Adjunto)
  const handleSendTender = async () => {
    if (!tender) return;
    if (!tender.proposal_file_url) {
      setMessage({
        type: 'error',
        text: 'Requisito HCI: Debe adjuntar el documento de propuesta antes de enviar al cliente.',
      });
      return;
    }

    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenders/${id}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName: 'Admin Comercial' }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al enviar propuesta');
      }

      setMessage({
        type: 'success',
        text: `¡Propuesta enviada formalmente a ${tender.client?.email}! Correo transaccional procesado con éxito y licitación activada.`,
      });
      fetchTender();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Transición general de estado
  const handleStatusChange = async (newStatus: string, notes?: string) => {
    setActionLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/tenders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          userName: 'Admin Comercial',
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al actualizar estado');
      }

      setMessage({
        type: 'success',
        text: `Estado actualizado a "${newStatus}" correctamente.`,
      });
      fetchTender();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Agregar Ítem
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) return;

    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenders/${id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: selectedProductId,
          quantity: parseFloat(itemQuantity) || 1,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al agregar producto');
      }

      setIsAddItemModalOpen(false);
      setSelectedProductId('');
      setItemQuantity('1');
      setMessage({ type: 'success', text: 'Producto añadido correctamente.' });
      fetchTender();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar Ítem
  const handleRemoveItem = async (itemId: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/tenders/${id}/items?itemId=${itemId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al eliminar ítem');
      }

      setMessage({ type: 'success', text: 'Producto retirado de la licitación.' });
      fetchTender();
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
          <p className="text-xs font-semibold">Cargando detalles de la licitación...</p>
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="flex-1 flex flex-col">
        <Navbar />
        <div className="p-12 text-center max-w-md mx-auto">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Licitación no encontrada</h2>
          <p className="text-xs text-zinc-500 mt-1 mb-4">
            El identificador solicitado no coincide con ningún registro activo.
          </p>
          <Link
            href="/licitaciones"
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
          >
            Regresar a Licitaciones
          </Link>
        </div>
      </div>
    );
  }

  const isEditable = tender.status === 'borrador' || tender.status === 'activa';
  const canModifyProducts = tender.status === 'borrador' || tender.status === 'activa';
  const totalPaid = (tender.payments || []).reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingBalance = Math.max(0, tender.total_estimado - totalPaid);

  const deadline = new Date(tender.fecha_limite);
  const isDeadlinePassed = deadline < new Date() && tender.status === 'activa';

  return (
    <div className="flex-1 flex flex-col">
      <Navbar onRefresh={fetchTender} />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Breadcrumbs & Navigation */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <Link
              href="/licitaciones"
              className="hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Licitaciones</span>
            </Link>
            <span>/</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
              {tender.code}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={tender.status} size="lg" />
          </div>
        </div>

        {/* Message Banner */}
        {message && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-xs font-medium animate-in fade-in ${
              message.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {message.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{message.text}</span>
            </div>
            <button
              onClick={() => setMessage(null)}
              className="opacity-70 hover:opacity-100 underline cursor-pointer"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Header Summary Card */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 rounded-md font-mono text-xs font-bold">
                  {tender.code}
                </span>
                <span className="text-xs text-zinc-400">
                  Creada el {new Date(tender.created_at).toLocaleDateString('es-ES')}
                </span>
              </div>
              <h1 className="text-xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                {tender.title}
              </h1>
              {tender.description && (
                <p className="text-xs text-zinc-500 mt-1 max-w-3xl leading-relaxed">
                  {tender.description}
                </p>
              )}
            </div>

            {/* Action Buttons Toolbar depending on state */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Acciones para BORRADOR */}
              {tender.status === 'borrador' && (
                <button
                  onClick={handleSendTender}
                  disabled={actionLoading || !tender.proposal_file_url}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
                  title={
                    !tender.proposal_file_url
                      ? 'Debe adjuntar la propuesta antes de enviar'
                      : 'Enviar formalmente por correo con adjunto'
                  }
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar al Cliente (Activar)</span>
                </button>
              )}

              {/* Acciones para ACTIVA */}
              {tender.status === 'activa' && (
                <>
                  <button
                    onClick={() =>
                      handleStatusChange(
                        'finalizada',
                        'Licitación adjudicada formalmente a la empresa. Entrega técnica y comercial completada.'
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                  >
                    <Trophy className="w-3.5 h-3.5" />
                    <span>Marcar Ganada (Finalizada)</span>
                  </button>

                  <button
                    onClick={() =>
                      handleStatusChange(
                        'perdida',
                        'Licitación declarada no ganada / desestimada.'
                      )
                    }
                    disabled={actionLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-zinc-700 dark:text-zinc-300 hover:text-rose-600 rounded-xl text-xs font-bold border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Declarar Perdida</span>
                  </button>
                </>
              )}

              {/* Acciones para FINALIZADA */}
              {tender.status === 'finalizada' && (
                <button
                  onClick={() =>
                    handleStatusChange(
                      'por_cobrar',
                      'Licitación facturada comercialmente. Se habilita el registro de pagos y cobros.'
                    )
                  }
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Facturar y Pasar a Cobranza (Por Cobrar)</span>
                </button>
              )}

              {/* Acciones para POR COBRAR */}
              {tender.status === 'por_cobrar' && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <DollarSign className="w-4 h-4" />
                  <span>Registrar Pago (${pendingBalance.toFixed(2)} pendiente)</span>
                </button>
              )}
            </div>
          </div>

          {/* Sub-cards Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Cliente</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">{tender.client?.name}</p>
                <p className="text-[11px] text-zinc-500">{tender.client?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Fecha Límite</span>
                <p className={`font-bold ${isDeadlinePassed ? 'text-rose-600' : 'text-zinc-900 dark:text-zinc-100'}`}>
                  {deadline.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}{' '}
                  - {deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </p>
                {tender.reminder_sent && (
                  <span className="text-[10px] text-emerald-600 font-medium">
                    ✓ Recordatorio 48h enviado
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-zinc-600 dark:text-zinc-400">
                <DollarSign className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-zinc-400">Presupuesto Máximo</span>
                <p className="font-bold text-zinc-900 dark:text-zinc-100">
                  ${Number(tender.presupuesto_maximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-[11px] text-zinc-500">
                  Cotizado: ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Lifecycle Stepper (HCI core component) */}
        <StatusStepper
          currentStatus={tender.status}
          hasProposalFile={Boolean(tender.proposal_file_url)}
        />

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-zinc-200 dark:border-zinc-800 overflow-x-auto">
          {[
            { id: 'items', label: `Productos y Cotización (${tender.items?.length || 0})` },
            { id: 'proposal', label: 'Documento de Propuesta' },
            { id: 'payments', label: `Pagos y Cobranzas (${tender.payments?.length || 0})` },
            { id: 'audit', label: `Historial y Auditoría (${tender.transitions?.length || 0})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB 1: PRODUCTOS Y COTIZACIÓN */}
        {activeTab === 'items' && (
          <div className="space-y-4">
            <TenderBudgetBar
              currentTotal={tender.total_estimado}
              maxBudget={tender.presupuesto_maximo}
            />

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Productos Asociados a la Licitación
                  </h3>
                  <p className="text-xs text-zinc-500">
                    {canModifyProducts
                      ? 'Puede agregar o retirar productos siempre que el total no supere el presupuesto máximo.'
                      : `En estado "${tender.status}" el catálogo está bloqueado por normativa de auditoría.`}
                  </p>
                </div>

                {canModifyProducts && (
                  <button
                    onClick={() => setIsAddItemModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar Producto</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-5">#</th>
                      <th className="py-3 px-5">Producto / Servicio</th>
                      <th className="py-3 px-5 text-center">Cantidad</th>
                      <th className="py-3 px-5 text-right">Precio Unitario</th>
                      <th className="py-3 px-5 text-right">Subtotal</th>
                      {canModifyProducts && <th className="py-3 px-5 text-center">Acción</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(!tender.items || tender.items.length === 0) ? (
                      <tr>
                        <td colSpan={canModifyProducts ? 6 : 5} className="py-8 text-center text-zinc-400">
                          Sin productos agregados a la propuesta
                        </td>
                      </tr>
                    ) : (
                      tender.items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3.5 px-5 text-zinc-400 font-medium">{idx + 1}</td>
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">
                              {item.product?.name || 'Producto'}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              Código: {item.product?.code || 'N/A'}
                            </span>
                          </td>
                          <td className="py-3.5 px-5 text-center font-bold">
                            {item.quantity} {item.product?.unit_measure}
                          </td>
                          <td className="py-3.5 px-5 text-right">
                            ${Number(item.unit_price).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            ${Number(item.subtotal).toFixed(2)}
                          </td>
                          {canModifyProducts && (
                            <td className="py-3.5 px-5 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                disabled={actionLoading}
                                className="p-1 text-zinc-400 hover:text-red-600 rounded-md transition-colors cursor-pointer"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 font-bold border-t border-zinc-200 dark:border-zinc-800">
                      <td colSpan={4} className="py-3 px-5 text-right text-zinc-600 dark:text-zinc-400">
                        Total Estimado de la Propuesta:
                      </td>
                      <td className="py-3 px-5 text-right text-sm text-zinc-900 dark:text-zinc-100">
                        ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      {canModifyProducts && <td />}
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DOCUMENTO DE PROPUESTA */}
        {activeTab === 'proposal' && (
          <div className="space-y-4">
            <FileUploader
              tenderId={tender.id}
              currentUrl={tender.proposal_file_url}
              currentName={tender.proposal_file_name}
              currentSize={tender.proposal_file_size}
              isReadOnly={tender.status === 'finalizada' || tender.status === 'por_cobrar' || tender.status === 'cobrada' || tender.status === 'perdida'}
              onUploadSuccess={(fileData) => {
                setMessage({
                  type: 'success',
                  text: `Documento "${fileData.name}" subido a Supabase Storage con éxito.`,
                });
                fetchTender();
              }}
            />

            <div className="p-4 bg-zinc-100/60 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 space-y-1">
              <p className="font-bold text-zinc-700 dark:text-zinc-300">Normativa de Almacenamiento & Envío:</p>
              <p>• Los archivos se almacenan en el bucket público de Supabase Storage (<code className="bg-zinc-200 dark:bg-zinc-800 px-1 py-0.5 rounded">proposals</code>).</p>
              <p>• Al transicionar a <strong className="text-blue-600">Activa</strong>, la API de Resend adjunta automáticamente este documento formal y lo envía al correo del cliente.</p>
            </div>
          </div>
        )}

        {/* TAB 3: PAGOS Y COBRANZAS */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Facturado</span>
                <p className="text-lg font-black text-zinc-900 dark:text-zinc-100 mt-1">
                  ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Total Pagado / Abonado</span>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  ${totalPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <span className="text-[10px] uppercase font-bold text-zinc-400">Saldo Pendiente de Cobro</span>
                <p className="text-lg font-black text-amber-600 mt-1">
                  ${pendingBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
              <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Registro de Pagos y Abonos
                  </h3>
                  <p className="text-xs text-zinc-500">
                    Historial de transacciones de cobranza
                  </p>
                </div>

                {tender.status === 'por_cobrar' && (
                  <button
                    onClick={() => setIsPaymentModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Registrar Pago</span>
                  </button>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-5">Fecha</th>
                      <th className="py-3 px-5">Referencia / Comprobante</th>
                      <th className="py-3 px-5 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {(!tender.payments || tender.payments.length === 0) ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-zinc-400">
                          No hay pagos registrados aún
                        </td>
                      </tr>
                    ) : (
                      tender.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3.5 px-5 font-medium">{p.payment_date}</td>
                          <td className="py-3.5 px-5 text-zinc-600 dark:text-zinc-300">
                            {p.reference || 'Sin referencia'}
                          </td>
                          <td className="py-3.5 px-5 text-right font-bold text-emerald-600">
                            +${Number(p.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDITORÍA Y TRANSICIONES */}
        {activeTab === 'audit' && (
          <TransitionHistory transitions={tender.transitions} />
        )}
      </main>

      {/* Modal para Agregar Ítem */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Agregar Producto a la Licitación
            </h3>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Producto *
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
                  required
                >
                  <option value="">Seleccione un producto...</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name} (${Number(p.unit_price).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Cantidad *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-center"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={actionLoading || !selectedProductId}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                >
                  {actionLoading ? 'Guardando...' : 'Añadir Ítem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Registrar Pago */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        tenderId={tender.id}
        tenderCode={tender.code}
        totalEstimado={tender.total_estimado}
        totalPagado={totalPaid}
        saldoPendiente={pendingBalance}
        onPaymentSuccess={(result) => {
          setMessage({
            type: 'success',
            text: result.message || 'Pago registrado exitosamente.',
          });
          fetchTender();
        }}
      />
    </div>
  );
}
