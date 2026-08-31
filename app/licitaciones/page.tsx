'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Navbar } from '@/components/layout/navbar';
import { StatusBadge } from '@/components/ui/status-badge';
import { Tender, Client, TenderStatus } from '@/lib/types/database';
import {
  Plus,
  Search,
  Filter,
  Building2,
  Calendar,
  DollarSign,
  ArrowRight,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';

export default function TendersListPage() {
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<string>('all');

  const fetchTenders = async () => {
    try {
      const res = await fetch('/api/tenders');
      const data = await res.json();
      if (data.success) {
        setTenders(data.data);
      }
    } catch (err) {
      console.error('Error fetching tenders:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch('/api/clients');
      const data = await res.json();
      if (data.success) {
        setClients(data.data);
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
    }
  };

  useEffect(() => {
    fetchTenders();
    fetchClients();
  }, []);

  const filteredTenders = tenders.filter((tender) => {
    const matchesSearch =
      tender.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tender.client?.name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = selectedStatus === 'all' || tender.status === selectedStatus;
    const matchesClient = selectedClient === 'all' || tender.client_id === selectedClient;

    return matchesSearch && matchesStatus && matchesClient;
  });

  const statusTabs: { id: string; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: tenders.length },
    { id: 'borrador', label: 'Borradores', count: tenders.filter((t) => t.status === 'borrador').length },
    { id: 'activa', label: 'Activas', count: tenders.filter((t) => t.status === 'activa').length },
    { id: 'finalizada', label: 'Ganadas', count: tenders.filter((t) => t.status === 'finalizada').length },
    { id: 'por_cobrar', label: 'Por Cobrar', count: tenders.filter((t) => t.status === 'por_cobrar').length },
    { id: 'cobrada', label: 'Cobradas', count: tenders.filter((t) => t.status === 'cobrada').length },
    { id: 'perdida', label: 'Perdidas', count: tenders.filter((t) => t.status === 'perdida').length },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <Navbar />

      <main className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-3">
              <FileSpreadsheet className="w-8 h-8 text-blue-600" />
              <span>Gestión de Licitaciones</span>
            </h1>
            <p className="text-sm text-zinc-500 mt-1.5">
              Catálogo centralizado de propuestas comerciales y estados de adjudicación
            </p>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
          {statusTabs.map((tab) => {
            const isActive = selectedStatus === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2.5 cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-blue-700 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search and Filters Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por código (ej. LIC-2026-001), título de proyecto o cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 pl-12 pr-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>

          <div className="relative">
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full h-12 px-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-sm text-zinc-700 dark:text-zinc-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-xs"
            >
              <option value="all">Todos los clientes</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tenders Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-16 text-center text-zinc-400 flex flex-col items-center justify-center">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm font-semibold">Cargando licitaciones...</p>
            </div>
          ) : filteredTenders.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-base font-semibold text-zinc-700 dark:text-zinc-300">
                No se encontraron licitaciones con los filtros seleccionados
              </p>
              <p className="text-sm text-zinc-500 mt-1.5">
                Pruebe ajustando el término de búsqueda o cambiando el filtro de estado.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 font-semibold text-zinc-500 uppercase tracking-wider text-xs">
                    <th className="py-5 px-6">Código & Licitación</th>
                    <th className="py-5 px-6">Cliente</th>
                    <th className="py-5 px-6">Estado</th>
                    <th className="py-5 px-6 text-right">Presupuesto / Total</th>
                    <th className="py-5 px-6">Fecha Límite</th>
                    <th className="py-5 px-6 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {filteredTenders.map((tender) => {
                    const deadline = new Date(tender.fecha_limite);
                    const isPast = deadline < new Date() && tender.status === 'activa';

                    return (
                      <tr
                        key={tender.id}
                        className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                      >
                        <td className="py-6 px-6">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 text-sm"
                          >
                            <span className="bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-lg font-mono text-xs text-zinc-700 dark:text-zinc-300">
                              {tender.code}
                            </span>
                            <span className="truncate max-w-xs">{tender.title}</span>
                          </Link>
                          {tender.description && (
                            <p className="text-xs text-zinc-500 truncate max-w-sm mt-1">
                              {tender.description}
                            </p>
                          )}
                        </td>

                        <td className="py-6 px-6">
                          <div className="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2 text-sm">
                            <Building2 className="w-4.5 h-4.5 text-zinc-400 shrink-0" />
                            <span className="truncate max-w-[200px]">{tender.client?.name || 'N/A'}</span>
                          </div>
                          <span className="text-xs text-zinc-500 mt-0.5">
                            {tender.client?.tax_id}
                          </span>
                        </td>

                        <td className="py-6 px-6">
                          <StatusBadge status={tender.status} size="sm" />
                        </td>

                        <td className="py-6 px-6 text-right">
                          <div className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                            ${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                          <div className="text-xs text-zinc-500 mt-0.5">
                            Máx: ${Number(tender.presupuesto_maximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                          </div>
                        </td>

                        <td className="py-6 px-6">
                          <div className={`flex items-center gap-1.5 font-medium text-sm ${isPast ? 'text-rose-600 font-bold' : 'text-zinc-700 dark:text-zinc-300'}`}>
                            <Calendar className="w-4.5 h-4.5 shrink-0" />
                            <span>
                              {deadline.toLocaleDateString('es-ES', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                          <span className="text-xs text-zinc-400 mt-0.5">
                            {deadline.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>

                        <td className="py-6 px-6 text-center">
                          <Link
                            href={`/licitaciones/${tender.id}`}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-600 dark:hover:text-blue-400 rounded-xl text-sm font-semibold transition-colors"
                          >
                            <span>Abrir</span>
                            <ArrowRight className="w-4 h-4" />
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
