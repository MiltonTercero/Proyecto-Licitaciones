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
    return NextResponse.json({ success: true, data: tender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
