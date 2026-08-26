import { Tender, Client, TenderItem } from '@/lib/types/database';

export function generateProposalEmailHtml({
  tender,
  client,
  items,
  appUrl,
}: {
  tender: Tender;
  client: Client;
  items: TenderItem[];
  appUrl: string;
}) {
  const itemsRows = items
    .map(
      (item, idx) => `
      <tr style="border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 12px 16px; font-size: 14px; color: #374151;">${idx + 1}</td>
        <td style="padding: 12px 16px; font-size: 14px; color: #111827; font-weight: 500;">
          ${item.product?.name || 'Producto / Servicio'}
          <br/>
          <span style="font-size: 12px; color: #6b7280;">Código: ${item.product?.code || 'N/A'}</span>
        </td>
        <td style="padding: 12px 16px; font-size: 14px; text-align: center; color: #374151;">${item.quantity}</td>
        <td style="padding: 12px 16px; font-size: 14px; text-align: right; color: #374151;">$${Number(item.unit_price).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
        <td style="padding: 12px 16px; font-size: 14px; text-align: right; font-weight: 600; color: #111827;">$${Number(item.subtotal).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
      </tr>
    `
    )
    .join('');

  const deadlineFormatted = new Date(tender.fecha_limite).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Presentación Formal de Propuesta - ${tender.code}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f4f6; margin: 0; padding: 24px; color: #1f2937;">
    <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.025em;">CONSULTORÍA Y SOLUCIONES CABALLERO</h1>
        <p style="margin: 8px 0 0; font-size: 14px; opacity: 0.9;">Presentación Oficial de Propuesta Técnico-Comercial</p>
      </div>

      <!-- Content -->
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; line-height: 1.5; margin-top: 0; color: #111827;">
          Estimado(a) <strong>${client.contact_name || client.name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
          Nos complace presentar formalmente nuestra propuesta técnico-económica para la licitación <strong>"${tender.title}"</strong> (Ref: <span style="background-color: #dbeafe; color: #1e40af; padding: 2px 6px; border-radius: 4px; font-weight: 600;">${tender.code}</span>).
        </p>

        <!-- Summary Card -->
        <div style="background-color: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; padding: 16px; margin: 24px 0;">
          <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b;">Resumen de la Licitación</h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 4px 0; color: #64748b; width: 40%;">Cliente:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">${client.name} (${client.tax_id})</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Presupuesto Máximo:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #0f172a;">$${Number(tender.presupuesto_maximo).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Total Propuesta:</td>
              <td style="padding: 4px 0; font-weight: 700; color: #16a34a; font-size: 16px;">$${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; color: #64748b;">Fecha Límite:</td>
              <td style="padding: 4px 0; font-weight: 600; color: #dc2626;">${deadlineFormatted}</td>
            </tr>
          </table>
        </div>

        <!-- Products Table -->
        <h3 style="margin: 24px 0 12px; font-size: 15px; color: #111827;">Detalle de Productos y Servicios</h3>
        <div style="overflow-x: auto;">
          <table style="width: 100%; border-collapse: collapse; text-align: left; border: 1px solid #e5e7eb; border-radius: 8px;">
            <thead>
              <tr style="background-color: #f9fafb; border-bottom: 1px solid #e5e7eb;">
                <th style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase;">#</th>
                <th style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase;">Ítem</th>
                <th style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; text-align: center;">Cant.</th>
                <th style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; text-align: right;">Unitario</th>
                <th style="padding: 10px 16px; font-size: 12px; color: #6b7280; text-transform: uppercase; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows || '<tr><td colspan="5" style="padding: 16px; text-align: center; color: #9ca3af;">Sin ítems registrados</td></tr>'}
            </tbody>
            <tfoot>
              <tr style="background-color: #f9fafb; font-weight: 700;">
                <td colspan="4" style="padding: 12px 16px; text-align: right; color: #374151;">Total General:</td>
                <td style="padding: 12px 16px; text-align: right; color: #111827; font-size: 15px;">$${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        ${
          tender.proposal_file_url
            ? `
        <!-- Proposal Attachment Box -->
        <div style="margin: 28px 0; padding: 16px; background-color: #eff6ff; border-radius: 8px; border: 1px dashed #3b82f6; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e40af;">Documento de Propuesta Adjunto</p>
          <p style="margin: 0 0 12px; font-size: 12px; color: #3b82f6;">${tender.proposal_file_name || 'Propuesta_Formal.pdf'}</p>
          <a href="${tender.proposal_file_url}" target="_blank" style="display: inline-block; background-color: #2563eb; color: #ffffff; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Descargar Documento Oficial
          </a>
        </div>
        `
            : ''
        }

        <p style="font-size: 13px; color: #6b7280; line-height: 1.5; margin-top: 24px;">
          Quedamos a su entera disposición para cualquier aclaración o reunión técnica previa al cierre del proceso de licitación.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; border-top: 1px solid #e5e7eb; padding: 20px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0 0 4px;">Sistema de Gestión de Licitaciones • Consultoría y Soluciones Caballero</p>
        <p style="margin: 0;">Este es un correo transaccional generado automáticamente.</p>
      </div>
    </div>
  </body>
  </html>
  `;
}

export function generateReminderEmailHtml({
  tender,
  client,
  hoursRemaining,
}: {
  tender: Tender;
  client: Client;
  hoursRemaining: number;
}) {
  const deadlineFormatted = new Date(tender.fecha_limite).toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>Recordatorio: Fecha Límite Próxima - ${tender.code}</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fef2f2; margin: 0; padding: 24px; color: #1f2937;">
    <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #fee2e2;">
      
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); padding: 28px 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 22px; font-weight: 700;">⚠️ Recordatorio de Vencimiento de Licitación</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">Quedan menos de ${Math.max(1, Math.round(hoursRemaining))} horas para la fecha límite</p>
      </div>

      <!-- Content -->
      <div style="padding: 28px 24px;">
        <p style="font-size: 15px; line-height: 1.5; margin-top: 0; color: #111827;">
          Estimado(a) <strong>${client.contact_name || client.name}</strong>,
        </p>
        <p style="font-size: 14px; line-height: 1.6; color: #4b5563;">
          Le recordamos cordialmente que el plazo límite de presentación y resolución para la licitación <strong>"${tender.title}"</strong> (Ref: <span style="font-weight: 600; color: #b91c1c;">${tender.code}</span>) está próximo a expirar.
        </p>

        <div style="background-color: #fff1f2; border-left: 4px solid #e11d48; padding: 14px 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-size: 14px; color: #9f1239; font-weight: 600;">
            Fecha y Hora Límite:
          </p>
          <p style="margin: 4px 0 0; font-size: 15px; color: #881337; font-weight: 700;">
            ${deadlineFormatted}
          </p>
        </div>

        <p style="font-size: 14px; color: #4b5563; line-height: 1.6;">
          Nuestra propuesta formal por un monto de <strong>$${Number(tender.total_estimado).toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong> se encuentra debidamente registrada en el sistema.
        </p>

        ${
          tender.proposal_file_url
            ? `
        <div style="margin: 20px 0; text-align: center;">
          <a href="${tender.proposal_file_url}" target="_blank" style="display: inline-block; background-color: #b91c1c; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">
            Revisar Documento Adjunto
          </a>
        </div>
        `
            : ''
        }

        <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
          Por favor contáctenos si requiere asistencia técnica o documentación adicional antes del cierre del plazo.
        </p>
      </div>

      <!-- Footer -->
      <div style="background-color: #f9fafb; border-top: 1px solid #fee2e2; padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af;">
        <p style="margin: 0;">Consultoría y Soluciones Caballero • Alerta Programada de Vencimiento</p>
      </div>
    </div>
  </body>
  </html>
  `;
}
