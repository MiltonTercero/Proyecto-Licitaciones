import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const { product_id, quantity } = body;

    if (!product_id || !quantity || Number(quantity) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Producto y cantidad válida (>0) son requeridos' },
        { status: 400 }
      );
    }

    const result = await dataStore.addItemToTender(id, product_id, Number(quantity));

    return NextResponse.json({ success: true, data: result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { success: false, error: 'ID del ítem a eliminar es requerido' },
        { status: 400 }
      );
    }

    const updatedTender = await dataStore.removeItemFromTender(id, itemId);

    return NextResponse.json({ success: true, data: updatedTender });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
