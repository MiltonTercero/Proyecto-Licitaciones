'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-context';
import { Product } from '@/lib/types/database';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Info,
} from 'lucide-react';

export default function ProductsPage() {
  const { user } = useAuth();
  const canWrite = user?.role === 'admin' || user?.role === 'gestor';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [unitMeasure, setUnitMeasure] = useState('UNIDAD');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      if (data.success) setProducts(data.data);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    if (!canWrite) return;
    setEditingProduct(null);
    setCode(`PRD-${Date.now().toString().slice(-4)}`);
    setName(''); setDescription(''); setUnitPrice(''); setUnitMeasure('UNIDAD');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    if (!canWrite) return;
    setEditingProduct(product);
    setCode(product.code); setName(product.name);
    setDescription(product.description || '');
    setUnitPrice(product.unit_price.toString());
    setUnitMeasure(product.unit_measure);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canWrite) return;
    setError(null);
    setSubmitting(true);
    const priceNum = parseFloat(unitPrice);
    if (isNaN(priceNum) || priceNum < 0) {
      setError('Ingrese un precio unitario válido');
      setSubmitting(false);
      return;
    }
    try {
      const url = editingProduct ? `/api/products/${editingProduct.id}` : '/api/products';
      const method = editingProduct ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, description, unit_price: priceNum, unit_measure: unitMeasure }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Error al guardar producto');
      setSuccessMsg(editingProduct ? 'Producto actualizado' : 'Producto registrado en catálogo');
      setModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canWrite) return;
    if (!confirm('¿Desea eliminar este producto del catálogo?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) { alert(data.error || 'Error al eliminar'); return; }
      fetchProducts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <span>Catálogo Maestro de Productos y Servicios</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Lista de bienes cotizables para licitaciones comerciales
            </p>
          </div>

          {canWrite ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              aria-label="Agregar nuevo producto al catálogo"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Nuevo Producto</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-xl text-xs font-semibold cursor-not-allowed select-none"
              title="Sin permiso para crear productos"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Solo lectura</span>
            </div>
          )}
        </div>

        {/* Banner de permisos para visualizador */}
        {!canWrite && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-xs text-blue-800 dark:text-blue-300"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" aria-hidden="true" />
            <div>
              <strong className="font-bold">Catálogo en modo de solo lectura</strong>
              <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                Tu rol de <span className="font-semibold capitalize">{user?.role}</span> te permite
                consultar precios y especificaciones del catálogo, pero no puedes agregar, modificar ni
                eliminar productos. Contacta a un Administrador o Gestor para solicitar cambios.
              </p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="underline cursor-pointer">Cerrar</button>
          </div>
        )}

        {/* Búsqueda */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar producto en el catálogo"
          />
        </div>

        {/* Tabla */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800/80 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-xs font-semibold">Cargando productos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-zinc-800/60 border-b border-slate-200 dark:border-zinc-800 font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Código</th>
                    <th className="py-3.5 px-5">Nombre y Especificación</th>
                    <th className="py-3.5 px-5 text-center">Unidad</th>
                    <th className="py-3.5 px-5 text-right">Precio Unitario</th>
                    <th className="py-3.5 px-5 text-center">
                      {canWrite ? 'Acciones' : 'Permisos'}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/70 dark:hover:bg-zinc-800/40 transition-colors">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-700 dark:text-zinc-300">
                          {product.code}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-slate-900 dark:text-zinc-100">{product.name}</p>
                        {product.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5 max-w-md">{product.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-600 dark:text-zinc-400">
                          {product.unit_measure}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900 dark:text-zinc-100 text-sm">
                        ${Number(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-center">
                        {canWrite ? (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleOpenEdit(product)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              aria-label={`Editar producto ${product.name}`}
                            >
                              <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                              aria-label={`Eliminar producto ${product.name}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                            </button>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-300 dark:text-zinc-600 text-[11px]" title="Sin permiso de edición">
                            <Lock className="w-3 h-3" aria-hidden="true" />
                            <span>Sin permiso</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal (solo admin/gestor) */}
      {modalOpen && canWrite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer" aria-label="Cerrar modal">
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" aria-hidden="true" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Código Único *</label>
                  <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-mono" required />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unidad de Medida</label>
                  <select value={unitMeasure} onChange={(e) => setUnitMeasure(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl">
                    <option value="UNIDAD">UNIDAD</option>
                    <option value="SERVICIO">SERVICIO</option>
                    <option value="LICENCIA">LICENCIA</option>
                    <option value="METRO">METRO</option>
                    <option value="HORA">HORA</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1">Nombre del Producto / Servicio *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Precio Unitario (USD) *</label>
                <input type="number" step="0.01" min="0" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl font-bold" required />
              </div>
              <div>
                <label className="block font-semibold mb-1">Descripción / Ficha Técnica</label>
                <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl" />
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button type="button" onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer">Cancelar</button>
                <button type="submit" disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer">
                  {submitting ? 'Guardando...' : 'Guardar Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
