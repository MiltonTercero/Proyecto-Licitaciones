'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Client } from '@/lib/types/database';
import {
  Search,
  Building2,
  X,
  Loader2,
  Check,
  User,
  Mail,
  FileText,
} from 'lucide-react';

interface ClientSearchComboboxProps {
  value: string; // client id
  onChange: (clientId: string, client?: Client | null) => void;
  required?: boolean;
}

export function ClientSearchCombobox({
  value,
  onChange,
  required = false,
}: ClientSearchComboboxProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Si ya hay un clientId seleccionado inicialmente, cargarlo
  useEffect(() => {
    if (value && !selectedClient) {
      fetch(`/api/clients/${value}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data) {
            setSelectedClient(data.data);
          }
        })
        .catch(() => {});
    }
  }, [value, selectedClient]);

  // Búsqueda con DEBOUNCE de 300ms
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setIsOpen(true);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    setLoading(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/clients/search?q=${encodeURIComponent(term)}&limit=8`
        );
        const data = await res.json();
        if (data.success) {
          setResults(data.data || []);
          setTotalCount(data.total || 0);
        }
      } catch (err) {
        console.error('Error buscando clientes:', err);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  // Carga inicial al abrir el dropdown si no se ha buscado nada
  const handleFocus = () => {
    setIsOpen(true);
    if (results.length === 0 && !loading) {
      handleSearchChange(searchTerm);
    }
  };

  const handleSelect = (client: Client) => {
    setSelectedClient(client);
    onChange(client.id, client);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = () => {
    setSelectedClient(null);
    onChange('', null);
    setSearchTerm('');
    setResults([]);
  };

  return (
    <div className="relative w-full space-y-2" ref={containerRef}>
      {/* Si hay un cliente seleccionado: mostrar tarjeta con botón X */}
      {selectedClient ? (
        <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-2xl flex items-center justify-between shadow-2xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="truncate text-xs">
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm truncate">
                  {selectedClient.name}
                </span>
                <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-md font-mono font-bold text-[10px]">
                  {selectedClient.tax_id}
                </span>
              </div>
              <div className="flex items-center gap-3 text-zinc-500 mt-0.5">
                <span className="flex items-center gap-1 truncate">
                  <Mail className="w-3 h-3 text-zinc-400" />
                  {selectedClient.email}
                </span>
                {selectedClient.contact_name && (
                  <span className="flex items-center gap-1 truncate hidden sm:flex">
                    <User className="w-3 h-3 text-zinc-400" />
                    {selectedClient.contact_name}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="p-2 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors shrink-0 cursor-pointer"
            title="Cambiar cliente"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      ) : (
        /* Input de búsqueda interactiva (Combobox) */
        <div className="relative">
          <Search className="w-4.5 h-4.5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por razón social, RUC/NIT o correo de empresa..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={handleFocus}
            required={required}
            className="w-full h-12 pl-11 pr-10 bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-2xl text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition-all shadow-2xs"
          />

          {loading && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <Loader2 className="w-4.5 h-4.5 animate-spin text-blue-600" />
            </div>
          )}

          {/* Desplegable de Resultados */}
          {isOpen && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden max-h-72 overflow-y-auto animate-in fade-in duration-150">
              {loading && results.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Buscando empresas en catálogo...</span>
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 space-y-1">
                  <Building2 className="w-6 h-6 mx-auto opacity-40 mb-1" />
                  <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    No se encontraron clientes
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Verifique el término ingresado o registre el cliente en el catálogo.
                  </p>
                </div>
              ) : (
                <div className="py-1.5 divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                    <span>Resultados de búsqueda</span>
                    <span>{totalCount} empresas</span>
                  </div>

                  {results.map((client) => (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => handleSelect(client)}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50/70 dark:hover:bg-blue-950/40 flex items-center justify-between gap-3 transition-colors cursor-pointer group"
                    >
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 transition-colors truncate">
                            {client.name}
                          </span>
                          <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 px-1.5 py-0.5 rounded-md font-mono text-[10px] font-semibold shrink-0">
                            {client.tax_id}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-0.5">
                          <span className="truncate">{client.email}</span>
                          {client.contact_name && (
                            <span className="text-zinc-400 truncate hidden sm:inline">
                              • Contacto: {client.contact_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="w-6 h-6 rounded-lg bg-zinc-100 dark:bg-zinc-800 group-hover:bg-blue-600 group-hover:text-white text-zinc-400 flex items-center justify-center shrink-0 transition-colors">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
