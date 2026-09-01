import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const clientId = searchParams.get('clientId');
    const search = searchParams.get('search')?.toLowerCase();

    let tenders = await dataStore.getTenders();

    if (status && status !== 'all') {
      tenders = tenders.filter((t) => t.status === status);
    }

    if (clientId && clientId !== 'all') {
      tenders = tenders.filter((t) => t.client_id === clientId);
    }

    if (search) {
      tenders = tenders.filter(
        (t) =>
          t.code.toLowerCase().includes(search) ||
          t.title.toLowerCase().includes(search) ||
          t.client?.name.toLowerCase().includes(search)
      );
    }

    return NextResponse.json({ success: true, data: tenders });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, client_id, presupuesto_maximo, fecha_limite, description, code, items } = body;

    if (!title || !client_id || !presupuesto_maximo || !fecha_limite) {
      return NextResponse.json(
        {
          success: false,
          error: 'Título, Empresa Cliente, Presupuesto Máximo y Fecha Límite son obligatorios',
        },
        { status: 400 }
      );
    }

    if (Number(presupuesto_maximo) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El presupuesto máximo debe ser un monto mayor a 0' },
        { status: 400 }
      );
    }

    let tender = await dataStore.createTender({
      title,
      client_id,
      presupuesto_maximo: Number(presupuesto_maximo),
      fecha_limite,
      description,
      code,
    });

    if (Array.isArray(items) && items.length > 0) {
      for (const item of items) {
        if (item.product_id && Number(item.quantity) > 0) {
          const res = await dataStore.addItemToTender(tender.id, item.product_id, Number(item.quantity));
          tender = res.tender;
        }
      }
    }

    return NextResponse.json({ success: true, data: tender }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
