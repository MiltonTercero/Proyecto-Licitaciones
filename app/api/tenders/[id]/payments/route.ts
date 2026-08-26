import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const tender = await dataStore.getTenderById(id);
    if (!tender) {
      return NextResponse.json(
        { success: false, error: 'Licitación no encontrada' },
        { status: 404 }
      );
    }

    const payments = tender.payments || [];
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const pendingBalance = Math.max(0, tender.total_estimado - totalPaid);

    return NextResponse.json({
      success: true,
      data: {
        payments,
        totalFacturado: tender.total_estimado,
        totalPagado: totalPaid,
        saldoPendiente: pendingBalance,
        isCobrada: tender.status === 'cobrada',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { amount, reference, userName } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto del pago debe ser mayor a 0' },
        { status: 400 }
      );
    }

    const result = await dataStore.registerPayment(
      id,
      Number(amount),
      reference,
      userName || 'Administrador Financiero'
    );

    return NextResponse.json({
      success: true,
      data: result,
      message: result.autoCobrada
        ? '¡Pago registrado exitosamente! La licitación ha quedado 100% saldada y pasó automáticamente a estado COBRADA.'
        : 'Pago registrado con éxito.',
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
