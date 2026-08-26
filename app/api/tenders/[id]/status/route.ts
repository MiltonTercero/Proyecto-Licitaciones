import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { TenderStatus } from '@/lib/types/database';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { status: targetStatus, userName, notes } = body;

    if (!targetStatus) {
      return NextResponse.json(
        { success: false, error: 'El estado destino es requerido' },
        { status: 400 }
      );
    }

    const updatedTender = await dataStore.transitionTenderStatus(
      id,
      targetStatus as TenderStatus,
      userName || 'Usuario',
      notes || `Cambio de estado a ${targetStatus}.`
    );

    return NextResponse.json({ success: true, data: updatedTender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
