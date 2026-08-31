import { AuditLog } from '@/lib/types/database';
import { dataStore } from '@/lib/storage/store';

export interface AuditParams {
  userId?: string | null;
  userEmail?: string | null;
  action: string;
  tableName?: string | null;
  recordId?: string | null;
  oldValues?: any;
  newValues?: any;
  ipAddress?: string | null;
}

/**
 * Registra un evento de auditoría en la base de datos / store y en la consola estructurada
 */
export async function logAudit(params: AuditParams): Promise<AuditLog> {
  const timestamp = new Date().toISOString();

  // Log estructurado en consola
  const level = params.action.includes('FAIL') || params.action.includes('DELETE') ? 'WARN' : 'INFO';
  console.log(
    `[${timestamp}] [${level}] [AUDIT:${params.action}] User: ${params.userEmail || params.userId || 'ANONYMOUS'} | IP: ${params.ipAddress || 'UNKNOWN'} | Table: ${params.tableName || 'N/A'} | ID: ${params.recordId || 'N/A'}`
  );

  const logEntry: AuditLog = {
    id: crypto.randomUUID(),
    user_id: params.userId || null,
    user_email: params.userEmail || null,
    action: params.action,
    table_name: params.tableName || null,
    record_id: params.recordId || null,
    old_values: params.oldValues !== undefined ? params.oldValues : null,
    new_values: params.newValues !== undefined ? params.newValues : null,
    ip_address: params.ipAddress || null,
    timestamp,
  };

  return dataStore.createAuditLog(logEntry);
}
