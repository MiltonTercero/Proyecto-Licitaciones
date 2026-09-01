'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/navbar';
import { useAuth } from '@/components/auth/auth-context';
import { Client } from '@/lib/types/database';
import {
  Building2,
  Plus,
  Search,
  Mail,
  Phone,
  MapPin,
  User,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function ClientsPage() {
  const { user, authFetch } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isGestor = user?.role === 'gestor';
  const isVisualizador = user?.role === 'visualizador';

  // Matriz de permisos actualizada
  const canCreate = isAdmin || isGestor;
  const canEdit = isAdmin || isGestor;
  const canDelete = isAdmin; // Solo el Administrador puede eliminar clientes

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [taxId, setTaxId] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [contactName, setContactName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchClients = async () => {
    try {
      const res = await authFetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleOpenCreate = () => {
    if (!canCreate) return;
    setEditingClient(null);
    setName('');
    setTaxId('');
    setEmail('');
    setPhone('');
    setAddress('');
    setContactName('');
    setError(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (client: Client) => {
    if (!canEdit) return;
    setEditingClient(client);
    setName(client.name);
    setTaxId(client.tax_id);
    setEmail(client.email);
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setContactName(client.contact_name || '');
    setError(null);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate && !editingClient) return;
    if (!canEdit && editingClient) return;

    setError(null);
    setSubmitting(true);
    try {
      const url = editingClient ? `/api/clients/${editingClient.id}` : '/api/clients';
      const method = editingClient ? 'PUT' : 'POST';
      const res = await authFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          tax_id: taxId,
          email,
          phone,
          address,
          contact_name: contactName,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Error al guardar cliente');
      }
      setSuccessMsg(editingClient ? 'Cliente actualizado exitosamente' : 'Cliente registrado exitosamente');
      setModalOpen(false);
      fetchClients();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete) {
      alert('Solo los administradores tienen permiso para eliminar clientes.');
      return;
    }
    if (!confirm('¿Está seguro de eliminar este cliente de forma definitiva?')) return;
    try {
      const res = await authFetch(`/api/clients/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        alert(data.message || data.error || 'Error al eliminar');
        return;
      }
      setSuccessMsg('Cliente eliminado del sistema.');
      fetchClients();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-zinc-100 tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-600" aria-hidden="true" />
              <span>Directorio de Empresas Clientes</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Entidades destinatarias de propuestas y facturación
            </p>
          </div>

          {canCreate ? (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
              aria-label="Registrar nuevo cliente"
            >
              <Plus className="w-4 h-4" aria-hidden="true" />
              <span>Nuevo Cliente</span>
            </button>
          ) : (
            <div
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-xl text-xs font-semibold cursor-not-allowed select-none"
              title="Sin permiso para crear clientes"
            >
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Solo lectura</span>
            </div>
          )}
        </div>

        {/* Banner descriptivo de permisos para Visualizador */}
        {isVisualizador && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60 rounded-2xl text-xs text-blue-800 dark:text-blue-300"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-blue-500" aria-hidden="true" />
            <div>
              <strong className="font-bold">Modo de consulta (Visualizador)</strong>
              <p className="mt-0.5 text-blue-700 dark:text-blue-400">
                Tu rol te permite consultar la cartera de clientes, pero no puedes crear, modificar ni eliminar registros.
              </p>
            </div>
          </div>
        )}

        {/* Banner descriptivo de permisos para Gestor */}
        {isGestor && (
          <div
            role="status"
            className="flex items-start gap-3 p-4 bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/60 rounded-2xl text-xs text-amber-800 dark:text-amber-300"
          >
            <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" aria-hidden="true" />
            <div>
              <strong className="font-bold">Permisos de Gestor (Operativo)</strong>
              <p className="mt-0.5 text-amber-700 dark:text-amber-400">
                Puedes registrar nuevos clientes y editar su información de contacto o fiscal. La eliminación de clientes está reservada exclusivamente para Administradores.
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

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
            aria-label="Buscar cliente"
          />
        </div>

        {/* Grid de Tarjetas de Clientes */}
        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" aria-hidden="true" />
            <p className="text-xs font-semibold">Cargando clientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.length === 0 && (
              <div className="col-span-full p-12 text-center text-slate-500 text-sm">
                No se encontraron clientes que coincidan con la búsqueda.
              </div>
            )}
            {filteredClients.map((client) => (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-zinc-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-mono font-bold bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-slate-600 dark:text-zinc-400">
                        {client.tax_id}
                      </span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100 mt-1">
                        {client.name}
                      </h3>
                    </div>

                    {/* Botones de acción según RBAC */}
                    <div className="flex items-center gap-1 shrink-0">
                      {/* Botón Editar: Visible para Admin y Gestor */}
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(client)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          aria-label={`Editar cliente ${client.name}`}
                          title="Editar información del cliente"
                        >
                          <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}

                      {/* Botón Eliminar: ÚNICAMENTE visible para Admin. Oculto para Gestor y Visualizador */}
                      {canDelete && (
                        <button
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                          aria-label={`Eliminar cliente ${client.name}`}
                          title="Eliminar cliente permanentemente (Admin)"
                        >
                          <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                        </button>
                      )}

                      {/* Visualizador sin permisos */}
                      {!canEdit && !canDelete && (
                        <span
                          className="p-1.5 text-slate-300 dark:text-zinc-600 cursor-not-allowed"
                          title="Solo lectura"
                        >
                          <Lock className="w-3.5 h-3.5" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 text-xs text-slate-600 dark:text-zinc-400 border-t border-slate-100 dark:border-zinc-800 pt-3">
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                      <span className="truncate">{client.email}</span>
                    </div>
                    {client.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                    {client.contact_name && (
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span>Contacto: {client.contact_name}</span>
                      </div>
                    )}
                    {client.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden="true" />
                        <span className="truncate">{client.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal Crear / Editar (Accesible por Admin y Gestor) */}
      {modalOpen && (canCreate || canEdit) && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-label={editingClient ? 'Editar cliente' : 'Nuevo cliente'}
        >
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
              <h3 className="text-sm font-bold text-slate-900 dark:text-zinc-100">
                {editingClient ? 'Editar Empresa Cliente' : 'Registrar Nueva Empresa Cliente'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label="Cerrar modal"
              >
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
              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  Razón Social / Nombre *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    RUC / NIT / CIF *
                  </label>
                  <input
                    type="text"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                    required
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    Correo Notificaciones *
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold mb-1 text-slate-700 dark:text-zinc-300">
                  Dirección Fiscal
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold cursor-pointer"
                >
                  {submitting ? 'Guardando...' : editingClient ? 'Guardar Cambios' : 'Guardar Cliente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
