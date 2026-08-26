import { Resend } from 'resend';
import { Tender, Client, TenderItem } from '@/lib/types/database';
import { generateProposalEmailHtml, generateReminderEmailHtml } from './templates';

const resendApiKey = process.env.RESEND_API_KEY || '';
const isResendActive = Boolean(resendApiKey && resendApiKey.startsWith('re_') && !resendApiKey.includes('demo_key'));

export const resendClient = isResendActive ? new Resend(resendApiKey) : null;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Licitaciones CSC <onboarding@resend.dev>';

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export async function sendFormalProposalEmail({
  tender,
  client,
  items,
}: {
  tender: Tender;
  client: Client;
  items: TenderItem[];
}): Promise<SendEmailResult> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const html = generateProposalEmailHtml({ tender, client, items, appUrl });
  const subject = `[Propuesta Formal] Licitación ${tender.code}: ${tender.title}`;

  // Preparamos los adjuntos
  const attachments: { filename: string; content?: Buffer; path?: string }[] = [];

  if (tender.proposal_file_url && tender.proposal_file_url.startsWith('http')) {
    try {
      // Intentamos descargar el archivo en un Buffer para enviarlo directamente como contenido binario a Resend
      const fileRes = await fetch(tender.proposal_file_url);
      if (fileRes.ok) {
        const arrayBuffer = await fileRes.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        attachments.push({
          filename: tender.proposal_file_name || `${tender.code}_Propuesta_Formal.pdf`,
          content: buffer,
        });
      } else {
        console.warn(`No se pudo descargar el archivo para adjuntar (${fileRes.status}): ${tender.proposal_file_url}`);
      }
    } catch (fetchErr) {
      console.warn('Error al obtener el buffer del adjunto:', fetchErr);
    }
  }

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: fromEmail,
        to: [client.email],
        subject,
        html,
        attachments: attachments.length > 0 ? attachments : undefined,
      });

      if (response.error) {
        console.error('Error enviando correo con Resend:', response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id, simulated: false };
    } catch (err: any) {
      console.error('Excepción en Resend:', err);
      return { success: false, error: err.message || 'Error al conectar con Resend' };
    }
  } else {
    // Modo simulación/demostración para pruebas locales inmediatas sin credencial activa
    console.log(`[RESEND SIMULADO] Correo de Propuesta enviado a: ${client.email}`);
    console.log(`[RESEND SIMULADO] Asunto: ${subject}`);
    console.log(`[RESEND SIMULADO] Adjuntos cargados:`, attachments.length);
    return {
      success: true,
      messageId: `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      simulated: true,
    };
  }
}

export async function sendDeadlineReminderEmail({
  tender,
  client,
  hoursRemaining,
}: {
  tender: Tender;
  client: Client;
  hoursRemaining: number;
}): Promise<SendEmailResult> {
  const html = generateReminderEmailHtml({ tender, client, hoursRemaining });
  const subject = `⚠️ [URGENTE] Recordatorio de Vencimiento: Licitación ${tender.code}`;

  if (resendClient) {
    try {
      const response = await resendClient.emails.send({
        from: fromEmail,
        to: [client.email],
        subject,
        html,
      });

      if (response.error) {
        console.error('Error enviando recordatorio con Resend:', response.error);
        return { success: false, error: response.error.message };
      }

      return { success: true, messageId: response.data?.id, simulated: false };
    } catch (err: any) {
      console.error('Excepción en recordatorio Resend:', err);
      return { success: false, error: err.message || 'Error al conectar con Resend' };
    }
  } else {
    console.log(`[RESEND SIMULADO] Recordatorio de 48h enviado a: ${client.email}`);
    console.log(`[RESEND SIMULADO] Asunto: ${subject}`);
    return {
      success: true,
      messageId: `sim_rem_${Date.now()}`,
      simulated: true,
    };
  }
}
