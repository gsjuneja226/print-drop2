import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { kioskId, id } = await req.json();
    const targetId = kioskId || id;

    if (!targetId) {
      return NextResponse.json({ error: 'kioskId is required' }, { status: 400 });
    }

    // Update is_online and last_ping
    const { data, error } = await supabaseAdmin
      .from('kiosks')
      .update({
        is_online: true,
        last_ping: new Date().toISOString(),
      })
      .eq('id', targetId)
      .select('*');

    if (error) {
      console.error('Ping update error:', error);
      return NextResponse.json({ error: 'Failed to update heartbeat' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      // Auto-create kiosk if it heartbeats first to ensure system availability
      const { error: insertError } = await supabaseAdmin
        .from('kiosks')
        .insert({
          id: targetId,
          location_name: `New Kiosk (${targetId})`,
          location_addr: 'Awaiting Location Details',
          is_active: true,
          is_online: true,
          last_ping: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to auto-create kiosk:', insertError);
        return NextResponse.json({ error: 'Kiosk not found and auto-creation failed' }, { status: 404 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Kiosk Ping API crash:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
