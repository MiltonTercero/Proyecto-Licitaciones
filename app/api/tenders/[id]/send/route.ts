import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { sendFormalProposalEmail } from '@/lib/email/resend';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json().catch(() => ({}));
    const userName = body.userName || 'Admin Comercial';

    const tender = await dataStore.getTenderById(id);
    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Licitación no encontrada' },
        { status: 404 }
      );
    }

    if (tender.status !== 'borrador') {
      return NextResponse.json(
        {
          success: false,
          error: `Solo se pueden enviar licitaciones en estado "borrador". Estado actual: "${tender.status}"`,
        },
        { status: 400 }
      );
    }

    // Regla de Negocio: Debe tener documento de propuesta adjunto
    if (!tender.proposal_file_url) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Requisito obligatorio: La licitación requiere tener un documento de propuesta formal adjunto antes de ser enviada.',
        },
        { status: 400 }
      );
    }

    if (!tender.client) {
      return NextResponse.json(
        { success: false, error: 'La licitación no tiene un cliente válido asociado' },
        { status: 400 }
      );
    }

    // 1. Enviar correo transaccional real vía Resend con adjunto
    const emailResult = await sendFormalProposalEmail({
      tender,
      client: tender.client,
      items: tender.items || [],
    });

    if (!emailResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Error al enviar correo con Resend: ${emailResult.error}`,
        },
        { status: 502 }
      );
    }

    // 2. Transicionar a estado "activa"
    const updatedTender = await dataStore.transitionTenderStatus(
      id,
      'activa',
      userName,
      `Propuesta enviada oficialmente a ${tender.client.email}. Correo procesado con éxito (Message ID: ${emailResult.messageId || 'simulado'}). Licitación activada.`
    );

    return NextResponse.json({
      success: true,
      data: updatedTender,
      emailEvidence: {
        sentTo: tender.client.email,
        messageId: emailResult.messageId,
        simulated: emailResult.simulated,
        attachedDocument: tender.proposal_file_name,
        documentUrl: tender.proposal_file_url,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
