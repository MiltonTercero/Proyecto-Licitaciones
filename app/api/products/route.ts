import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function GET() {
  try {
    const products = await dataStore.getProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.name || body.unit_price === undefined || Number(body.unit_price) < 0) {
      return NextResponse.json(
        { success: false, error: 'Nombre y precio unitario válido son obligatorios' },
        { status: 400 }
      );
    }
    const newProduct = await dataStore.createProduct(body);
    return NextResponse.json({ success: true, data: newProduct }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
