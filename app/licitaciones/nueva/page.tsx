'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { TenderBudgetBar } from '@/components/tenders/tender-budget-bar';
import { ClientSearchCombobox } from '@/components/clients/client-search-combobox';
import { Client, Product } from '@/lib/types/database';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  Sparkles,
  User,
  ClipboardList,
  Paperclip,
  Check,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Vertical Stepper component
// ─────────────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    step: 1,
    title: 'Datos & Cliente',
    desc: 'Presupuesto y plazo',
    icon: ClipboardList,
  },
  {
    step: 2,
    title: 'Productos',
    desc: 'Cotización e ítems',
    icon: Package,
  },
  {
    step: 3,
    title: 'Propuesta & Cierre',
    desc: 'Adjunto y activación',
    icon: Paperclip,
  },
];

function VerticalStepper({ current }: { current: number }) {
  return (
    <aside
      className="hidden lg:flex flex-col w-56 shrink-0 sticky top-24 self-start gap-1 pt-2"
      aria-label="Pasos del asistente de creación"
    >
      {STEPS.map((item, idx) => {
        const Icon = item.icon;
        const isDone = current > item.step;
        const isCurrent = current === item.step;
        const isUpcoming = current < item.step;

        return (
          <div key={item.step} className="relative flex flex-col">
            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`absolute left-5 top-12 w-0.5 h-8 transition-colors duration-300 ${
                  isDone ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-zinc-700'
                }`}
                aria-hidden="true"
              />
            )}
            <div
              className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all duration-200 ${
                isCurrent
                  ? 'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 shadow-sm'
                  : isDone
                  ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40'
                  : 'opacity-50'
              }`}
            >
              {/* Circle */}
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 font-bold text-sm transition-all duration-200 ${
                  isDone
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200/50'
                    : 'bg-slate-200 dark:bg-zinc-700 text-slate-500 dark:text-zinc-400'
                }`}
                aria-hidden="true"
              >
                {isDone ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
              </div>

              {/* Text */}
              <div>
                <p
                  className={`text-xs font-bold leading-tight ${
                    isCurrent
                      ? 'text-blue-800 dark:text-blue-300'
                      : isDone
                      ? 'text-emerald-700 dark:text-emerald-400'
                      : 'text-slate-600 dark:text-zinc-400'
                  }`}
                >
                  {item.title}
                </p>
                <p className="text-[10px] text-slate-500 dark:text-zinc-500 mt-0.5">{item.desc}</p>
              </div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Label helper
// ─────────────────────────────────────────────────────────────────────────────
function FieldLabel({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-xs font-bold text-slate-700 dark:text-zinc-300 mb-1.5">
      {children}
      {required && (
        <span className="text-rose-500 ml-0.5" aria-hidden="true">
          *
        </span>
      )}
    </label>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Input base class
// ─────────────────────────────────────────────────────────────────────────────
const inputCls =
  'w-full px-4 py-3 bg-slate-50 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl text-xs text-slate-900 dark:text-zinc-100 placeholder-slate-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-150';

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────
export default function NewTenderWizardPage() {
  const router = useRouter();

  const [currentStep, setCurrentStep] = useState(1);

  // Step 1 state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [presupuestoMaximo, setPresupuestoMaximo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Step 2 state
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; quantity: number; product: Product }[]
  >([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('1');

  // Step 3 state
  const [proposalFile, setProposalFile] = useState<File | null>(null);

  // Master lists
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [resClients, resProducts] = await Promise.all([
          fetch('/api/clients'),
          fetch('/api/products'),
        ]);
        const dataClients = await resClients.json();
        const dataProducts = await resProducts.json();
        if (dataClients.success) setClients(dataClients.data);
        if (dataProducts.success) setProducts(dataProducts.data);
      } catch (err) {
        console.error('Error cargando catálogos:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();

    const defaultDate = new Date(Date.now() + 1000 * 60 * 60 * 24 * 10);
    setFechaLimite(defaultDate.toISOString().slice(0, 16));
  }, []);

  const maxBudgetNum = parseFloat(presupuestoMaximo) || 0;
  const currentTotalCalculated = selectedItems.reduce(
    (sum, item) => sum + item.quantity * item.product.unit_price,
    0
  );
  const isBudgetExceeded = maxBudgetNum > 0 && currentTotalCalculated > maxBudgetNum;

  const handleAddProduct = () => {
    if (!selectedProductToAdd) return;
    const product = products.find((p) => p.id === selectedProductToAdd);
    if (!product) return;

    const qty = parseFloat(quantityToAdd) || 1;
    if (qty <= 0) return;

    const projectedTotal = currentTotalCalculated + qty * product.unit_price;
    if (maxBudgetNum > 0 && projectedTotal > maxBudgetNum) {
      setError(
        `Al agregar este producto el total ($${projectedTotal.toFixed(2)}) superará el presupuesto máximo ($${maxBudgetNum.toFixed(2)})`
      );
      return;
    }

    setError(null);
    const existingIndex = selectedItems.findIndex((i) => i.productId === product.id);
    if (existingIndex !== -1) {
      const updated = [...selectedItems];
      updated[existingIndex].quantity += qty;
      setSelectedItems(updated);
    } else {
      setSelectedItems([...selectedItems, { productId: product.id, quantity: qty, product }]);
    }
    setSelectedProductToAdd('');
    setQuantityToAdd('1');
  };

  const handleRemoveItem = (index: number) => {
    const updated = [...selectedItems];
    updated.splice(index, 1);
    setSelectedItems(updated);
    setError(null);
  };

  const validateStep1 = () => {
    if (!title.trim()) return 'El título de la licitación es obligatorio';
    if (!clientId) return 'Debe seleccionar una empresa cliente';
    if (!presupuestoMaximo || maxBudgetNum <= 0)
      return 'Ingrese un presupuesto máximo válido mayor a 0';
    if (!fechaLimite) return 'La fecha límite de presentación es obligatoria';
    return null;
  };

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (isBudgetExceeded) {
        setError('El total de productos no puede superar el presupuesto máximo');
        return;
      }
      setCurrentStep(3);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveTender = async (sendImmediately: boolean = false) => {
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch('/api/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          client_id: clientId,
          presupuesto_maximo: maxBudgetNum,
          fecha_limite: new Date(fechaLimite).toISOString(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al crear la licitación');
      const createdTender = data.data;

      for (const item of selectedItems) {
        await fetch(`/api/tenders/${createdTender.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ product_id: item.productId, quantity: item.quantity }),
        });
      }

      if (proposalFile) {
        const formData = new FormData();
        formData.append('file', proposalFile);
        await fetch(`/api/tenders/${createdTender.id}/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      if (sendImmediately) {
        if (!proposalFile)
          throw new Error('Para enviar formalmente al cliente debe adjuntar el archivo de propuesta.');
        const sendRes = await fetch(`/api/tenders/${createdTender.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: 'Admin Comercial' }),
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success)
          throw new Error(sendData.error || 'Error al enviar por correo');
      }

      router.push(`/licitaciones/${createdTender.id}`);
    } catch (err: any) {
      setError(err.message || 'Error en el proceso de creación');
      setSubmitting(false);
    }
  };

  const selectedClientObj = clients.find((c) => c.id === clientId);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-8">
          <Link
            href="/licitaciones"
            className="hover:text-slate-800 dark:hover:text-zinc-200 flex items-center gap-1 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Volver a Licitaciones</span>
          </Link>
          <span aria-hidden="true">/</span>
          <span className="font-semibold text-slate-800 dark:text-zinc-200">Asistente Guiado</span>
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-zinc-100 tracking-tight">
            Crear Nueva Licitación Comercial
          </h1>
          <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1.5">
            Siga los 3 pasos guiados para configurar datos generales, catálogo de productos y propuesta formal.
          </p>
        </div>

        {/* Mobile Stepper (Horizontal, only < lg) */}
        <div className="lg:hidden mb-6">
          <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-zinc-900 rounded-2xl border border-slate-200 dark:border-zinc-800">
            {STEPS.map((item) => {
              const isDone = currentStep > item.step;
              const isCurrent = currentStep === item.step;
              const Icon = item.icon;
              return (
                <div
                  key={item.step}
                  className={`flex-1 flex items-center gap-2 p-2.5 rounded-xl transition-all ${
                    isCurrent
                      ? 'bg-white dark:bg-zinc-800 shadow-sm border border-slate-200 dark:border-zinc-700'
                      : isDone
                      ? 'opacity-80'
                      : 'opacity-40'
                  }`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white'
                        : isCurrent
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-300 dark:bg-zinc-700 text-slate-500'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5" /> : item.step}
                  </div>
                  <span className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 truncate hidden sm:block">
                    {item.title}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main Layout: Stepper (left) + Form (right) */}
        <div className="flex gap-8 items-start">
          <VerticalStepper current={currentStep} />

          {/* Form Container */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="p-4 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3 text-xs text-rose-700 dark:text-rose-300 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{error}</span>
              </div>
            )}

            {/* ─────── STEP 1: General Data & Client ─────── */}
            {currentStep === 1 && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Paso 1: Información General y Empresa Cliente
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
                    Defina el objeto de la licitación, la entidad solicitante y los límites financieros
                  </p>
                </div>

                {/* Title — full width */}
                <div>
                  <FieldLabel required>Título del Proyecto / Licitación</FieldLabel>
                  <input
                    type="text"
                    placeholder="Ej. Renovación de Redes e Infraestructura de Servidores Data Center"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className={inputCls}
                    aria-required="true"
                  />
                </div>

                {/* Description — full width */}
                <div>
                  <FieldLabel>Descripción o Alcance Comercial</FieldLabel>
                  <textarea
                    rows={3}
                    placeholder="Detalle resumido de los términos de referencia, requerimientos técnicos o notas especiales..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={inputCls}
                  />
                </div>

                {/* Client — full width */}
                <div>
                  <FieldLabel required>
                    Empresa Cliente Solicitante{' '}
                    <span className="font-normal text-slate-400">(Búsqueda inteligente)</span>
                  </FieldLabel>
                  <ClientSearchCombobox
                    value={clientId}
                    onChange={(selectedId) => setClientId(selectedId)}
                    required
                  />
                </div>

                {/* Budget + Date — 2 columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <FieldLabel required>Presupuesto Máximo (USD)</FieldLabel>
                    <div className="relative">
                      <DollarSign
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="number"
                        step="0.01"
                        min="1"
                        placeholder="25000.00"
                        value={presupuestoMaximo}
                        onChange={(e) => setPresupuestoMaximo(e.target.value)}
                        className={`${inputCls} pl-10 font-bold`}
                        aria-required="true"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      La suma de productos nunca podrá superar este valor.
                    </p>
                  </div>

                  <div>
                    <FieldLabel required>Fecha y Hora Límite de Presentación</FieldLabel>
                    <div className="relative">
                      <Calendar
                        className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                        aria-hidden="true"
                      />
                      <input
                        type="datetime-local"
                        value={fechaLimite}
                        onChange={(e) => setFechaLimite(e.target.value)}
                        className={`${inputCls} pl-10`}
                        aria-required="true"
                      />
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">
                      El cron marcará como Perdida si expira sin resolución.
                    </p>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer"
                    aria-label="Continuar a selección de productos"
                  >
                    <span>Continuar a Productos</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}

            {/* ─────── STEP 2: Products & Budget ─────── */}
            {currentStep === 2 && (
              <div className="space-y-6">
                {/* Budget Bar */}
                <TenderBudgetBar
                  currentTotal={currentTotalCalculated}
                  maxBudget={maxBudgetNum}
                />

                <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                    <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                      <Package className="w-4 h-4 text-blue-600" aria-hidden="true" />
                      Paso 2: Agregar Productos del Catálogo Maestro
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Seleccione los ítems que conformarán la oferta comercial
                    </p>
                  </div>

                  {/* Product selector */}
                  <div className="p-4 bg-slate-50 dark:bg-zinc-800/50 rounded-2xl border border-slate-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                    <div className="sm:col-span-7">
                      <FieldLabel>Seleccionar Producto o Servicio</FieldLabel>
                      <select
                        value={selectedProductToAdd}
                        onChange={(e) => setSelectedProductToAdd(e.target.value)}
                        className={inputCls}
                        aria-label="Seleccionar producto del catálogo"
                      >
                        <option value="">Seleccione un ítem del catálogo...</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.code} – {p.name} (${Number(p.unit_price).toFixed(2)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <FieldLabel>Cantidad</FieldLabel>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={quantityToAdd}
                        onChange={(e) => setQuantityToAdd(e.target.value)}
                        className={`${inputCls} text-center font-bold`}
                        aria-label="Cantidad de unidades"
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <button
                        type="button"
                        onClick={handleAddProduct}
                        disabled={!selectedProductToAdd}
                        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors duration-150 shadow-xs"
                        aria-label="Agregar producto seleccionado a la oferta"
                      >
                        <Plus className="w-4 h-4" aria-hidden="true" />
                        <span>Agregar a Oferta</span>
                      </button>
                    </div>
                  </div>

                  {/* Items table */}
                  <div className="overflow-x-auto border border-slate-200 dark:border-zinc-800 rounded-2xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 font-bold text-slate-500 uppercase tracking-wider text-[10px]">
                          <th className="py-3.5 px-5">Ítem / Código</th>
                          <th className="py-3.5 px-5 text-center">Cant.</th>
                          <th className="py-3.5 px-5 text-right">Precio Unit.</th>
                          <th className="py-3.5 px-5 text-right">Subtotal</th>
                          <th className="py-3.5 px-5 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                        {selectedItems.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="py-10 text-center text-slate-400">
                              <Package className="w-7 h-7 mx-auto mb-1.5 opacity-40" aria-hidden="true" />
                              <span className="text-xs">No hay productos añadidos aún</span>
                            </td>
                          </tr>
                        ) : (
                          selectedItems.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                              <td className="py-4 px-5">
                                <p className="font-bold text-slate-900 dark:text-zinc-100">{item.product.name}</p>
                                <span className="text-[10px] text-slate-500 font-mono">{item.product.code}</span>
                              </td>
                              <td className="py-4 px-5 text-center font-bold text-slate-800 dark:text-zinc-200">
                                {item.quantity} {item.product.unit_measure}
                              </td>
                              <td className="py-4 px-5 text-right text-slate-700 dark:text-zinc-300">
                                ${item.product.unit_price.toFixed(2)}
                              </td>
                              <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-zinc-100">
                                ${(item.quantity * item.product.unit_price).toFixed(2)}
                              </td>
                              <td className="py-4 px-5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(idx)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl transition-colors cursor-pointer"
                                  aria-label={`Eliminar ${item.product.name} de la oferta`}
                                >
                                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-zinc-800">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl cursor-pointer transition-colors"
                    >
                      ← Volver al Paso 1
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep}
                      disabled={isBudgetExceeded}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold shadow-xs cursor-pointer transition-all duration-150"
                      aria-label="Continuar a propuesta y cierre"
                    >
                      <span>Continuar a Propuesta</span>
                      <ArrowRight className="w-4 h-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ─────── STEP 3: Proposal & Confirmation ─────── */}
            {currentStep === 3 && (
              <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-8">
                <div className="border-b border-slate-100 dark:border-zinc-800 pb-4">
                  <h2 className="text-sm font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
                    <Paperclip className="w-4 h-4 text-blue-600" aria-hidden="true" />
                    Paso 3: Documento de Propuesta y Activación
                  </h2>
                  <p className="text-xs text-slate-500 mt-1">
                    Adjunte el documento formal de la propuesta y decida si guardarla como borrador o enviarla al cliente.
                  </p>
                </div>

                {/* File Upload */}
                <div className="space-y-3">
                  <FieldLabel>Adjuntar Documento Formal (PDF / Word)</FieldLabel>
                  <label
                    className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-300 dark:border-zinc-700 rounded-2xl bg-slate-50/60 dark:bg-zinc-800/30 hover:bg-slate-100 dark:hover:bg-zinc-800/60 hover:border-blue-400 transition-all cursor-pointer"
                    aria-label="Área para subir archivo de propuesta"
                  >
                    <Paperclip className="w-8 h-8 text-slate-400 dark:text-zinc-500" aria-hidden="true" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                        Haz clic para seleccionar o arrastra el archivo aquí
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">PDF, DOC, DOCX o ZIP — máx 20MB</p>
                    </div>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.zip"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setProposalFile(e.target.files[0]);
                        }
                      }}
                      className="sr-only"
                    />
                  </label>

                  {proposalFile && (
                    <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-3 text-xs text-emerald-800 dark:text-emerald-200">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" aria-hidden="true" />
                      <span>
                        Archivo seleccionado:{' '}
                        <strong>{proposalFile.name}</strong>{' '}
                        ({(proposalFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </span>
                    </div>
                  )}
                </div>

                {/* Review Summary */}
                <div className="p-5 bg-slate-50/80 dark:bg-zinc-800/30 rounded-2xl border border-slate-200/60 dark:border-zinc-800 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-700 dark:text-zinc-300 uppercase tracking-wider text-[11px]">
                    Resumen de la Licitación
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Cliente</span>
                      <p className="font-semibold text-slate-900 dark:text-zinc-100">{selectedClientObj?.name || '—'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Presupuesto Máximo</span>
                      <p className="font-semibold text-slate-900 dark:text-zinc-100">
                        ${maxBudgetNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Total Cotizado</span>
                      <p className="font-bold text-emerald-600">
                        ${currentTotalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block mb-0.5">Ítems añadidos</span>
                      <p className="font-semibold text-slate-900 dark:text-zinc-100">{selectedItems.length} productos</p>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex flex-wrap justify-between items-center gap-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    disabled={submitting}
                    className="px-5 py-2.5 text-xs font-bold text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl cursor-pointer transition-colors"
                  >
                    ← Volver a Productos
                  </button>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveTender(false)}
                      disabled={submitting}
                      className="px-5 py-3 bg-slate-200 dark:bg-zinc-800 hover:bg-slate-300 dark:hover:bg-zinc-700 text-slate-800 dark:text-zinc-200 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
                    >
                      {submitting ? 'Guardando...' : 'Guardar como Borrador'}
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSaveTender(true)}
                      disabled={submitting || !proposalFile}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl text-sm font-bold shadow-xs transition-all duration-150 cursor-pointer"
                      aria-label="Guardar licitación y enviar propuesta al cliente"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                          <span>Procesando y Notificando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" aria-hidden="true" />
                          <span>Guardar y Enviar al Cliente</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
          {/* end flex-1 form area */}
        </div>
        {/* end main flex */}
      </main>
    </div>
  );
}
