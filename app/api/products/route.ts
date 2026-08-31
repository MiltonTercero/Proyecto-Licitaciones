import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { requireAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';

export async function GET(req: Request) {
  try {
    const products = await dataStore.getProducts();
    return NextResponse.json({ success: true, data: products });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'PRODUCTS_FETCH_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);

  try {
    // RBAC: Solo Admin puede crear productos
    const auth = requireAuth(request, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const body = await request.json();
    if (!body.name || body.unit_price === undefined || Number(body.unit_price) < 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Nombre y precio unitario válido son obligatorios',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    const newProduct = await dataStore.createProduct({
      ...body,
      created_by: auth.user!.userId,
    });

    // Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'CREATE_PRODUCT',
      tableName: 'products',
      recordId: newProduct.id,
      newValues: newProduct,
      ipAddress: ip,
    });

    return NextResponse.json(
      { success: true, message: 'Producto creado con éxito', data: newProduct },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'PRODUCT_CREATE_ERROR' },
      { status: 400 }
    );
  }
}
