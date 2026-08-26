'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { Product } from '@/lib/types/database';
import {
  Package,
  Plus,
  Search,
  DollarSign,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Tag,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form
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
      if (data.success) {
        setProducts(data.data);
      }
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
    setEditingProduct(null);
    setCode(`PRD-${Date.now().toString().slice(-4)}`);
    setName('');
    setDescription('');
    setUnitPrice('');
    setUnitMeasure('UNIDAD');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (product: Product) => {
    setEditingProduct(product);
    setCode(product.code);
    setName(product.name);
    setDescription(product.description || '');
    setUnitPrice(product.unit_price.toString());
    setUnitMeasure(product.unit_measure);
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({
          code,
          name,
          description,
          unit_price: priceNum,
          unit_measure: unitMeasure,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al guardar producto');
      }

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
    if (!confirm('¿Desea eliminar este producto del catálogo?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.error || 'Error al eliminar');
        return;
      }
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
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
              <Package className="w-6 h-6 text-blue-600" />
              <span>Catálogo Maestro de Productos y Servicios</span>
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Lista de bienes cotizables para licitaciones comerciales
            </p>
          </div>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg(null)} className="underline">Cerrar</button>
          </div>
        )}

        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-12 text-center text-zinc-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs font-semibold">Cargando productos...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
                    <th className="py-3.5 px-5">Código</th>
                    <th className="py-3.5 px-5">Nombre y Especificación</th>
                    <th className="py-3.5 px-5 text-center">Unidad</th>
                    <th className="py-3.5 px-5 text-right">Precio Unitario</th>
                    <th className="py-3.5 px-5 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filtered.map((product) => (
                    <tr key={product.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40">
                      <td className="py-4 px-5">
                        <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-zinc-700 dark:text-zinc-300">
                          {product.code}
                        </span>
                      </td>
                      <td className="py-4 px-5">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100">{product.name}</p>
                        {product.description && (
                          <p className="text-[11px] text-zinc-500 mt-0.5 max-w-md">{product.description}</p>
                        )}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
                          {product.unit_measure}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                        ${Number(product.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-4 px-5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(product.id)}
                            className="p-1.5 text-zinc-400 hover:text-red-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Crear / Editar */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {editingProduct ? 'Editar Producto' : 'Nuevo Producto en Catálogo'}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {error && (
              <div className="p-2.5 bg-red-50 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1">Código Único *</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1">Unidad de Medida</label>
                  <select
                    value={unitMeasure}
                    onChange={(e) => setUnitMeasure(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl"
                  >
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
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Precio Unitario (USD) *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">Descripción / Ficha Técnica</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-zinc-600 hover:bg-zinc-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-bold"
                >
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
