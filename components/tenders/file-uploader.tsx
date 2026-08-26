'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  ExternalLink,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface FileUploaderProps {
  tenderId: string;
  currentUrl?: string | null;
  currentName?: string | null;
  currentSize?: number | null;
  isReadOnly?: boolean;
  onUploadSuccess: (fileData: { url: string; name: string; size: number }) => void;
}

export function FileUploader({
  tenderId,
  currentUrl,
  currentName,
  currentSize,
  isReadOnly = false,
  onUploadSuccess,
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file) return;
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`/api/tenders/${tenderId}/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al subir el archivo');
      }

      onUploadSuccess(data.data);
    } catch (err: any) {
      setError(err.message || 'Error en la subida del documento');
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isReadOnly) setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isReadOnly) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return 'Tamaño desconocido';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <span>Documento de Propuesta Formal</span>
            <span className="text-xs text-rose-500 font-medium">*Requerido para enviar</span>
          </h4>
          <p className="text-xs text-zinc-500 mt-0.5">
            Archivos PDF o Word con especificaciones técnicas y cotización oficial
          </p>
        </div>

        {currentUrl && (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Adjunto Válido</span>
          </span>
        )}
      </div>

      {/* Si ya existe un documento cargado */}
      {currentUrl && (
        <div className="mb-3 p-3.5 bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                {currentName || 'Propuesta_Formal.pdf'}
              </p>
              <p className="text-[11px] text-zinc-500">
                {formatFileSize(currentSize)} • Listo para notificación oficial
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={currentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1.5 rounded-md transition-colors"
            >
              <span>Ver Archivo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Zona de Dropzone (si no es solo lectura) */}
      {!isReadOnly && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 scale-[0.99]'
              : 'border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 bg-zinc-50/50 dark:bg-zinc-800/30'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx,.zip"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />

          <div className="flex flex-col items-center justify-center gap-2">
            <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded-full text-zinc-600 dark:text-zinc-300">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {uploading
                  ? 'Subiendo archivo a Supabase Storage...'
                  : currentUrl
                  ? 'Arrastre un nuevo archivo o haga clic para reemplazar la propuesta'
                  : 'Arrastre el archivo aquí o haga clic para seleccionar'}
              </p>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Formatos permitidos: PDF, DOCX, DOC (Máx. 25 MB)
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="mt-3 p-2.5 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
