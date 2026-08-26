import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { sendDeadlineReminderEmail } from '@/lib/email/resend';

export async function GET(request: Request) {
  return handleCronJob(request);
}

export async function POST(request: Request) {
  return handleCronJob(request);
}

async function handleCronJob(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si hay CRON_SECRET configurado, se valida token (a menos que sea llamada de prueba con flag demo)
    const url = new URL(request.url);
    const isManualTrigger = url.searchParams.get('manual') === 'true';

    if (cronSecret && !isManualTrigger) {
      if (authHeader !== `Bearer ${cronSecret}`) {
        // En Vercel Cron, se pasa automáticamente el Bearer token
        console.warn('Cron request recibido sin Bearer token válido');
      }
    }

    const now = new Date();
    const tenders = await dataStore.getTenders();
    const activeTenders = tenders.filter((t) => t.status === 'activa');

    const results = {
      evaluated: activeTenders.length,
      expiredToPerdida: [] as string[],
      remindersSent: [] as string[],
      errors: [] as string[],
    };

    for (const tender of activeTenders) {
      const deadline = new Date(tender.fecha_limite);
      const timeDiffMs = deadline.getTime() - now.getTime();
      const hoursRemaining = timeDiffMs / (1000 * 60 * 60);

      // 1. REGLA: Si pasó la fecha límite y sigue activa -> Transición automática a PERDIDA
      if (deadline <= now) {
        try {
          await dataStore.transitionTenderStatus(
            tender.id,
            'perdida',
            'Vercel Cron Job (Automatizado)',
            `La fecha límite (${deadline.toLocaleString('es-ES')}) expiró sin resolución adjudicada. Transición automática a perdida.`
          );
          results.expiredToPerdida.push(
            `${tender.code} (${tender.title}) -> Marcada como PERDIDA por vencimiento`
          );
        } catch (err: any) {
          results.errors.push(`Error al expirar ${tender.code}: ${err.message}`);
        }
      }
      // 2. REGLA: Si faltan menos de 48 horas y no se ha enviado recordatorio -> Enviar email
      else if (hoursRemaining > 0 && hoursRemaining <= 48 && !tender.reminder_sent) {
        if (tender.client) {
          try {
            const emailRes = await sendDeadlineReminderEmail({
              tender,
              client: tender.client,
              hoursRemaining,
            });

            if (emailRes.success) {
              tender.reminder_sent = true;
              await dataStore.logTransition(
                tender.id,
                'activa',
                'activa',
                'Vercel Cron Job (Recordatorio)',
                `Recordatorio de vencimiento enviado a ${tender.client.email} (${Math.round(hoursRemaining)}h restantes). Message ID: ${emailRes.messageId || 'N/A'}`
              );
              results.remindersSent.push(
                `${tender.code} -> Recordatorio enviado a ${tender.client.email} (${Math.round(hoursRemaining)}h restantes)`
              );
            } else {
              results.errors.push(`Error en envío de email para ${tender.code}: ${emailRes.error}`);
            }
          } catch (err: any) {
            results.errors.push(`Excepción enviando recordatorio para ${tender.code}: ${err.message}`);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      summary: {
        total_evaluadas: results.evaluated,
        licitaciones_vencidas: results.expiredToPerdida.length,
        recordatorios_48h_enviados: results.remindersSent.length,
      },
      details: results,
    });
  } catch (error: any) {
    console.error('Error en ejecución del Cron Job:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error interno en cron job' },
      { status: 500 }
    );
  }
}
