'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { TenderBudgetBar } from '@/components/tenders/tender-budget-bar';
import { Client, Product } from '@/lib/types/database';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Building2,
  Calendar,
  DollarSign,
  Package,
  FileText,
  Plus,
  Trash2,
  AlertCircle,
  Loader2,
  UploadCloud,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

export default function NewTenderWizardPage() {
  const router = useRouter();

  // Wizard Step (1: Datos Generales, 2: Productos y Presupuesto, 3: Propuesta y Guardado)
  const [currentStep, setCurrentStep] = useState(1);

  // Datos del paso 1
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [clientId, setClientId] = useState('');
  const [presupuestoMaximo, setPresupuestoMaximo] = useState('');
  const [fechaLimite, setFechaLimite] = useState('');

  // Datos del paso 2
  const [selectedItems, setSelectedItems] = useState<
    { productId: string; quantity: number; product: Product }[]
  >([]);
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [quantityToAdd, setQuantityToAdd] = useState('1');

  // Datos del paso 3
  const [proposalFile, setProposalFile] = useState<File | null>(null);

  // Listas maestras
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

    // Fecha límite predeterminada: 10 días en el futuro
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
    if (!presupuestoMaximo || maxBudgetNum <= 0) return 'Ingrese un presupuesto máximo válido mayor a 0';
    if (!fechaLimite) return 'La fecha límite de presentación es obligatoria';
    return null;
  };

  const handleNextStep = () => {
    setError(null);
    if (currentStep === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (isBudgetExceeded) {
        setError('El total de productos no puede superar el presupuesto máximo');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleSaveTender = async (sendImmediately: boolean = false) => {
    setError(null);
    setSubmitting(true);

    try {
      // 1. Crear licitación
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
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al crear la licitación');
      }

      const createdTender = data.data;

      // 2. Agregar productos seleccionados
      for (const item of selectedItems) {
        await fetch(`/api/tenders/${createdTender.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product_id: item.productId,
            quantity: item.quantity,
          }),
        });
      }

      // 3. Subir archivo de propuesta si fue seleccionado
      if (proposalFile) {
        const formData = new FormData();
        formData.append('file', proposalFile);
        await fetch(`/api/tenders/${createdTender.id}/upload`, {
          method: 'POST',
          body: formData,
        });
      }

      // 4. Si el usuario solicitó enviar inmediatamente
      if (sendImmediately) {
        if (!proposalFile) {
          throw new Error('Para enviar formalmente al cliente debe adjuntar el archivo de propuesta.');
        }
        const sendRes = await fetch(`/api/tenders/${createdTender.id}/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userName: 'Admin Comercial' }),
        });
        const sendData = await sendRes.json();
        if (!sendRes.ok || !sendData.success) {
          throw new Error(sendData.error || 'Error al enviar por correo');
        }
      }

      router.push(`/licitaciones/${createdTender.id}`);
    } catch (err: any) {
      setError(err.message || 'Error en el proceso de creación');
      setSubmitting(false);
    }
  };

  const selectedClientObj = clients.find((c) => c.id === clientId);

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="p-6 md:p-8 max-w-4xl mx-auto w-full space-y-6">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <Link href="/licitaciones" className="hover:text-zinc-800 dark:hover:text-zinc-200 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver a Licitaciones</span>
          </Link>
          <span>/</span>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">Asistente Guiado</span>
        </div>

        {/* Header */}
        <div>
          <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
            Crear Nueva Licitación Comercial
          </h1>
          <p className="text-xs text-zinc-500 mt-1">
            Siga los 3 pasos guiados para configurar datos generales, catálogo de productos y propuesta formal.
          </p>
        </div>

        {/* Wizard Stepper Header (HCI clarity) */}
        <div className="grid grid-cols-3 gap-3 p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800">
          {[
            { step: 1, title: '1. Datos & Cliente', desc: 'Presupuesto y plazo' },
            { step: 2, title: '2. Productos', desc: 'Cotización e ítems' },
            { step: 3, title: '3. Propuesta & Fin', desc: 'Adjunto y activación' },
          ].map((item) => {
            const isDone = currentStep > item.step;
            const isCurrent = currentStep === item.step;

            return (
              <div
                key={item.step}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-white dark:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-700'
                    : isDone
                    ? 'opacity-80'
                    : 'opacity-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-blue-600 text-white'
                      : 'bg-zinc-300 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="w-4 h-4" /> : item.step}
                </div>
                <div className="truncate">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 leading-tight">
                    {item.title}
                  </p>
                  <p className="text-[10px] text-zinc-500 truncate">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje de Error si existe */}
        {error && (
          <div className="p-3.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-2.5 text-xs text-red-700 dark:text-red-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* PASO 1: DATOS GENERALES Y CLIENTE */}
        {currentStep === 1 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Paso 1: Información General y Empresa Cliente
              </h2>
              <p className="text-xs text-zinc-500">
                Defina el objeto de la licitación, la entidad solicitante y los límites financieros
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Título del Proyecto / Licitación *
                </label>
                <input
                  type="text"
                  placeholder="Ej. Renovación de Redes e Infraestructura de Servidores Data Center"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Descripción o Alcance Comercial
                </label>
                <textarea
                  rows={3}
                  placeholder="Detalle resumido de los términos de referencia, requerimientos técnicos o notas especiales..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Empresa Cliente Solicitante *
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccione una empresa...</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.tax_id})
                    </option>
                  ))}
                </select>
                {selectedClientObj && (
                  <p className="text-[11px] text-zinc-500 mt-1 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    <span>Contacto: {selectedClientObj.contact_name || 'N/A'} • Email: {selectedClientObj.email}</span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Presupuesto Máximo Permitido (USD) *
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="Ej. 25000.00"
                    value={presupuestoMaximo}
                    onChange={(e) => setPresupuestoMaximo(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Regla de negocio: La suma de productos nunca podrá superar este valor.
                </p>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Fecha y Hora Límite de Presentación *
                </label>
                <div className="relative max-w-sm">
                  <Calendar className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="datetime-local"
                    value={fechaLimite}
                    onChange={(e) => setFechaLimite(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-[10px] text-zinc-500 mt-1">
                  Si la licitación no se resuelve antes de esta fecha, el cron job la marcará automáticamente como Perdida.
                </p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={handleNextStep}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
              >
                <span>Continuar a Selección de Productos</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: PRODUCTOS Y CONTROL DE PRESUPUESTO */}
        {currentStep === 2 && (
          <div className="space-y-4">
            {/* Barra de presupuesto en tiempo real */}
            <TenderBudgetBar
              currentTotal={currentTotalCalculated}
              maxBudget={maxBudgetNum}
            />

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-5">
              <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                    Paso 2: Agregar Productos del Catálogo Maestro
                  </h2>
                  <p className="text-xs text-zinc-500">
                    Seleccione los ítems que conformarán la oferta comercial
                  </p>
                </div>
              </div>

              {/* Selector de producto */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl border border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-7">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Seleccionar Producto o Servicio
                  </label>
                  <select
                    value={selectedProductToAdd}
                    onChange={(e) => setSelectedProductToAdd(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs"
                  >
                    <option value="">Seleccione un ítem del catálogo...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.code} - {p.name} (${Number(p.unit_price).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Cantidad
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={quantityToAdd}
                    onChange={(e) => setQuantityToAdd(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-center"
                  />
                </div>

                <div className="sm:col-span-3">
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    disabled={!selectedProductToAdd}
                    className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar a Oferta</span>
                  </button>
                </div>
              </div>

              {/* Tabla de ítems seleccionados */}
              <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800 rounded-xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                      <th className="py-2.5 px-4">Ítem / Código</th>
                      <th className="py-2.5 px-4 text-center">Cant.</th>
                      <th className="py-2.5 px-4 text-right">Precio Unit.</th>
                      <th className="py-2.5 px-4 text-right">Subtotal</th>
                      <th className="py-2.5 px-4 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                    {selectedItems.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-zinc-400">
                          <Package className="w-6 h-6 mx-auto mb-1 opacity-50" />
                          <span>No hay productos añadidos aún</span>
                        </td>
                      </tr>
                    ) : (
                      selectedItems.map((item, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                          <td className="py-3 px-4">
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">
                              {item.product.name}
                            </p>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {item.product.code}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold">
                            {item.quantity} {item.product.unit_measure}
                          </td>
                          <td className="py-3 px-4 text-right">
                            ${item.product.unit_price.toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-zinc-900 dark:text-zinc-100">
                            ${(item.quantity * item.product.unit_price).toFixed(2)}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-zinc-400 hover:text-red-600 rounded-md transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center pt-4 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setCurrentStep(1)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
                >
                  Volver al Paso 1
                </button>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isBudgetExceeded}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                >
                  <span>Continuar a Propuesta y Cierre</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PASO 3: PROPUESTA FORMAL Y CONFIRMACIÓN */}
        {currentStep === 3 && (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                Paso 3: Documento de Propuesta y Activación
              </h2>
              <p className="text-xs text-zinc-500">
                Adjunte el documento formal de la propuesta (PDF) y decida si guardarla como borrador o enviarla inmediatamente al cliente.
              </p>
            </div>

            {/* Selector de Archivo Local */}
            <div className="p-5 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
              <label className="block text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Adjuntar Documento Formal de la Propuesta (PDF / Word) *
              </label>

              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.zip"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProposalFile(e.target.files[0]);
                    }
                  }}
                  className="text-xs text-zinc-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              {proposalFile && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>Archivo seleccionado: <strong>{proposalFile.name}</strong> ({(proposalFile.size / (1024 * 1024)).toFixed(2)} MB)</span>
                </div>
              )}
            </div>

            {/* Resumen Final de Revisión */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-800/30 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
              <h4 className="font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider text-[11px]">
                Resumen de la Licitación
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div>
                  <span className="text-zinc-400 text-[10px]">Cliente</span>
                  <p className="font-semibold">{selectedClientObj?.name}</p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Presupuesto Máximo</span>
                  <p className="font-semibold">${maxBudgetNum.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Total Cotizado</span>
                  <p className="font-bold text-emerald-600">${currentTotalCalculated.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                </div>
                <div>
                  <span className="text-zinc-400 text-[10px]">Ítems añadidos</span>
                  <p className="font-semibold">{selectedItems.length} productos</p>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-between items-center gap-3 pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                disabled={submitting}
                className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl cursor-pointer"
              >
                Volver a Productos
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveTender(false)}
                  disabled={submitting}
                  className="px-4 py-2.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 text-zinc-800 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  {submitting ? 'Guardando...' : 'Guardar como Borrador'}
                </button>

                <button
                  type="button"
                  onClick={() => handleSaveTender(true)}
                  disabled={submitting || !proposalFile}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Procesando y Notificando...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Guardar y Enviar al Cliente</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
