import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';
import { requireAuth } from '@/lib/auth/middleware';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (auth.errorResponse) return auth.errorResponse;
    const transitions = await dataStore.getAllTransitions();
    const tenders = await dataStore.getTenders();

    const enriched = transitions.map((tr) => {
      const tender = tenders.find((t) => t.id === tr.tender_id);
      return {
        ...tr,
        tenderCode: tender?.code || 'N/A',
        tenderTitle: tender?.title || 'Licitación',
        clientName: tender?.client?.name || 'Cliente',
      };
    });

    return NextResponse.json({ success: true, data: enriched });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
