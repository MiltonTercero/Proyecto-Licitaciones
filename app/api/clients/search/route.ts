import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { authenticateRequest } from '@/lib/auth/middleware';

export async function GET(req: Request) {
  const startTime = performance.now();

  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Búsqueda parametrizada y paginada
    const result = await dataStore.searchClients(query, page, limit);
    const elapsedMs = performance.now() - startTime;

    return NextResponse.json({
      success: true,
      data: result.data,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
      executionTimeMs: parseFloat(elapsedMs.toFixed(2)),
    });
  } catch (error: any) {
    console.error('[CLIENTS:SEARCH] Error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Error al buscar clientes en el catálogo.',
        code: 'SEARCH_ERROR',
      },
      { status: 500 }
    );
  }
}
