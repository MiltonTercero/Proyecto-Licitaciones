import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { requireAuth } from '@/lib/auth/middleware';
import { logAudit } from '@/lib/audit/audit-logger';
import { getClientIp } from '@/lib/auth/rate-limiter';

export async function GET(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const product = await dataStore.getProductById(id);
    if (!product) {
      return NextResponse.json(
        { success: false, message: 'Producto no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: product });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(request);

  try {
    // RBAC: Solo Admin puede modificar productos
    const auth = requireAuth(request, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const oldProduct = await dataStore.getProductById(id);
    if (!oldProduct) {
      return NextResponse.json(
        { success: false, message: 'Producto no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const updated = await dataStore.updateProduct(id, {
      ...body,
      updated_by: auth.user!.userId,
    });

    // Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'UPDATE_PRODUCT',
      tableName: 'products',
      recordId: id,
      oldValues: oldProduct,
      newValues: updated,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'PRODUCT_UPDATE_ERROR' },
      { status: 400 }
    );
  }
}

export async function DELETE(
  _request: Request,
  props: { params: Promise<{ id: string }> }
) {
  const ip = getClientIp(_request);

  try {
    // RBAC: Solo Admin puede eliminar productos
    const auth = requireAuth(_request, ['admin']);
    if (auth.errorResponse) return auth.errorResponse;

    const { id } = await props.params;
    const oldProduct = await dataStore.getProductById(id);
    if (!oldProduct) {
      return NextResponse.json(
        { success: false, message: 'Producto no encontrado', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await dataStore.deleteProduct(id);

    // Auditoría
    await logAudit({
      userId: auth.user!.userId,
      userEmail: auth.user!.email,
      action: 'DELETE_PRODUCT',
      tableName: 'products',
      recordId: id,
      oldValues: oldProduct,
      ipAddress: ip,
    });

    return NextResponse.json({ success: true, message: 'Producto eliminado con éxito' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message, code: 'PRODUCT_DELETE_ERROR' },
      { status: 400 }
    );
  }
}
