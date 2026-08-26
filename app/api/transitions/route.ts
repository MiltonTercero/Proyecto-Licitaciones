import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/storage/store';

export async function GET() {
  try {
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
