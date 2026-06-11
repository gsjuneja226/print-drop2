import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { kioskId: string } }) {
  try {
    const { kioskId } = params;

    if (!kioskId) {
      return NextResponse.json({ error: 'kioskId is required' }, { status: 400 });
    }

    const { data: kiosk, error } = await supabaseAdmin
      .from('kiosks')
      .select('*')
      .eq('id', kioskId)
      .single();

    if (error || !kiosk) {
      return NextResponse.json({ error: 'Kiosk not found' }, { status: 404 });
    }

    // Determine online status based on last ping
    let status = 'offline';
    if (kiosk.is_active) {
      if (kiosk.last_ping) {
        const lastPingDate = new Date(kiosk.last_ping).getTime();
        const diffMs = Date.now() - lastPingDate;
        const diffMins = diffMs / 1000 / 60;

        if (diffMins < 2) {
          status = 'online';
        } else if (diffMins < 10) {
          status = 'idle';
        }
      }
    } else {
      status = 'inactive';
    }

    return NextResponse.json({
      id: kiosk.id,
      location_name: kiosk.location_name,
      location_addr: kiosk.location_addr,
      is_active: kiosk.is_active,
      status, // 'online' | 'idle' | 'offline' | 'inactive'
    });
  } catch (error: any) {
    console.error('Get Kiosk Info API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
