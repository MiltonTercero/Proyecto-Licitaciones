import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const clients = await dataStore.getClients();
    return NextResponse.json({ success: true, data: clients });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || !body.tax_id || !body.email) {
      return NextResponse.json(
        { success: false, error: 'Nombre, RUC/NIT y correo electrónico son obligatorios' },
        { status: 400 }
      );
    }
    const newClient = await dataStore.createClient(body);
    return NextResponse.json({ success: true, data: newClient }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
